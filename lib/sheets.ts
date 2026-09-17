/**
 * 상담신청을 구글 시트에도 한 줄씩 적는다.
 *
 * 원본은 Blob 이고 시트는 보기용 사본이다. 시트 쪽이 실패해도 상담신청 접수에는
 * 영향이 없어야 하므로, 여기 함수들은 호출하는 쪽에서 실패를 삼킨다.
 *
 * googleapis 패키지 대신 서비스계정 JWT(jose)로 토큰을 받아 REST 를 직접 부른다.
 * 필요한 건 탭 만들기·읽기·추가뿐이라 무거운 패키지를 들일 이유가 없다.
 *
 * 환경변수: GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID
 * (선택) GOOGLE_SHEET_TAB — 기본 "후기페이지_상담신청"
 */
import { SignJWT, importPKCS8 } from "jose";
import type { Consult } from "./types";

const HEADER = ["신청일시", "페이지", "이름", "전화번호", "자본금 규모", "유입경로"];

function config() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const tab = process.env.GOOGLE_SHEET_TAB || "후기페이지_상담신청";
  if (!email || !key || !sheetId) return null;
  return { email, key, sheetId, tab };
}

type Config = NonNullable<ReturnType<typeof config>>;

export function sheetsEnabled(): boolean {
  return config() !== null;
}

let cachedToken: { value: string; exp: number } | null = null;

async function accessToken(cfg: Config): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/spreadsheets" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(cfg.email)
    .setSubject(cfg.email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPKCS8(cfg.key, "RS256"));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`구글 인증 실패 ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, exp: now + data.expires_in };
  return cachedToken.value;
}

async function api<T>(cfg: Config, path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken(cfg);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cfg.sheetId}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`시트 API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

const range = (cfg: Config, a1: string) => encodeURIComponent(`'${cfg.tab}'!${a1}`);

let tabReady = false;

/** 탭이 없으면 만들고, 첫 줄에 머리글을 넣는다. */
async function ensureTab(cfg: Config): Promise<void> {
  if (tabReady) return;
  const meta = await api<{ sheets?: { properties?: { title?: string } }[] }>(
    cfg,
    "?fields=sheets.properties.title",
  );
  if (!meta.sheets?.some((s) => s.properties?.title === cfg.tab)) {
    await api(cfg, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [
          { addSheet: { properties: { title: cfg.tab, gridProperties: { frozenRowCount: 1 } } } },
        ],
      }),
    });
  }
  const head = await api<{ values?: string[][] }>(cfg, `/values/${range(cfg, "A1:F1")}`);
  if (!head.values?.[0]?.length) {
    await api(cfg, `/values/${range(cfg, "A1")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [HEADER] }),
    });
  }
  tabReady = true;
}

const toRow = (c: Consult) => [
  c.createdAt,
  c.page ? `/${c.page}` : "",
  c.name,
  c.phone,
  c.capital,
  c.source,
];

/** 같은 신청인지 가르는 기준. 신청 시각과 전화번호가 같으면 같은 줄로 본다. */
const keyOf = (createdAt: string, phone: string) => `${createdAt}|${phone}`;

/** 상담신청 여러 건을 시트 맨 아래에 붙인다. 전화번호 앞 0이 지워지지 않게 RAW 로 넣는다. */
export async function appendConsultsToSheet(rows: Consult[]): Promise<void> {
  const cfg = config();
  if (!cfg || !rows.length) return;
  await ensureTab(cfg);
  await api(cfg, `/values/${range(cfg, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows.map(toRow) }),
  });
}

/**
 * 저장소의 상담신청 전체와 시트를 비교해 시트에 빠진 것만 채운다.
 * 몇 번을 눌러도 중복이 생기지 않는다.
 */
export async function syncConsultsToSheet(all: Consult[]): Promise<{ added: number; total: number }> {
  const cfg = config();
  if (!cfg) throw new Error("구글 시트 환경변수가 설정되지 않았습니다.");
  await ensureTab(cfg);

  const existing = await api<{ values?: string[][] }>(cfg, `/values/${range(cfg, "A2:D")}`);
  const have = new Set((existing.values || []).map((r) => keyOf(r[0] || "", r[3] || "")));
  const missing = all.filter((c) => !have.has(keyOf(c.createdAt, c.phone)));

  await appendConsultsToSheet(missing);
  return { added: missing.length, total: all.length };
}

/** 어드민에 띄울 시트 주소 */
export function sheetUrl(): string | null {
  const cfg = config();
  return cfg ? `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/edit` : null;
}
