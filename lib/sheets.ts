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

const HEADER = ["날짜", "시간", "페이지", "이름", "전화번호", "자본금 규모", "유입경로"];

/**
 * 신청 시각은 "2026. 9. 17. 오후 2:03:25" 형태로 저장돼 있다.
 * 시트에서 들어온 순서대로 정렬되도록 날짜 "2026-09-17" · 시간 "14:03:25" 로 나눈다.
 */
export function splitDateTime(createdAt: string): { date: string; time: string } {
  const m = createdAt.match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!m) return { date: createdAt, time: "" };
  let hour = Number(m[5]);
  if (m[4] === "오후" && hour < 12) hour += 12;
  if (m[4] === "오전" && hour === 12) hour = 0;
  const two = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${m[1]}-${two(Number(m[2]))}-${two(Number(m[3]))}`,
    time: `${two(hour)}:${m[6]}:${m[7] ?? "00"}`,
  };
}

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
let tabGid: number | null = null;

/** 탭이 없으면 만들고, 첫 줄에 머리글을 넣는다. */
async function ensureTab(cfg: Config): Promise<void> {
  if (tabReady) return;
  const meta = await api<{ sheets?: { properties?: { title?: string; sheetId?: number } }[] }>(
    cfg,
    "?fields=sheets.properties(title,sheetId)",
  );
  const found = meta.sheets?.find((s) => s.properties?.title === cfg.tab);
  tabGid = found?.properties?.sheetId ?? null;
  if (!found) {
    const created = await api<{ replies?: { addSheet?: { properties?: { sheetId?: number } } }[] }>(cfg, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [
          { addSheet: { properties: { title: cfg.tab, gridProperties: { frozenRowCount: 1 } } } },
        ],
      }),
    });
    tabGid = created.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
  }
  const head = await api<{ values?: string[][] }>(cfg, `/values/${range(cfg, "A1:G1")}`);
  if ((head.values?.[0] || []).join("|") !== HEADER.join("|")) {
    await api(cfg, `/values/${range(cfg, "A1")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [HEADER] }),
    });
  }
  tabReady = true;
}

const toRow = (c: Consult) => [
  splitDateTime(c.createdAt).date,
  splitDateTime(c.createdAt).time,
  c.page ? `/${c.page}` : "",
  c.name,
  c.phone,
  c.capital,
  c.source,
];

/** 같은 신청인지 가르는 기준. 날짜·시간·전화번호가 같으면 같은 줄로 본다. */
const keyOf = (date: string, time: string, phone: string) => `${date} ${time}|${phone}`;
const keyOfConsult = (c: Consult) => {
  const { date, time } = splitDateTime(c.createdAt);
  return keyOf(date, time, c.phone);
};

/** 날짜·시간 오름차순. 들어온 순서대로 나열된다. */
const byTime = (a: Consult, b: Consult) => keyOfConsult(a).localeCompare(keyOfConsult(b));

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

  const existing = await api<{ values?: string[][] }>(cfg, `/values/${range(cfg, "A2:E")}`);
  const have = new Set((existing.values || []).map((r) => keyOf(r[0] || "", r[1] || "", r[4] || "")));
  const missing = all.filter((c) => !have.has(keyOfConsult(c))).sort(byTime);

  await appendConsultsToSheet(missing);
  // 예전 신청을 뒤늦게 채웠으면 맨 아래에 붙으므로, 날짜·시간순으로 다시 정렬한다
  if (missing.length) await sortByTime(cfg);
  return { added: missing.length, total: all.length };
}

/** 머리글을 뺀 전체를 날짜 → 시간 오름차순으로 정렬한다. */
async function sortByTime(cfg: Config): Promise<void> {
  if (tabGid === null) return;
  await api(cfg, ":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          sortRange: {
            range: { sheetId: tabGid, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: HEADER.length },
            sortSpecs: [
              { dimensionIndex: 0, sortOrder: "ASCENDING" },
              { dimensionIndex: 1, sortOrder: "ASCENDING" },
            ],
          },
        },
      ],
    }),
  });
}

/**
 * 탭을 저장소 기준으로 통째로 다시 쓴다. 열 구성이 바뀌었을 때 한 번 쓴다.
 * 다시 쓰는 사이 들어온 신청이 덮일 수 있으니, 끝난 뒤 syncConsultsToSheet 를 한 번 더 부른다.
 */
export async function rebuildSheet(all: Consult[]): Promise<{ written: number }> {
  const cfg = config();
  if (!cfg) throw new Error("구글 시트 환경변수가 설정되지 않았습니다.");
  tabReady = false;
  await ensureTab(cfg);
  const rows = [...all].sort(byTime).map(toRow);
  await api(cfg, `/values/${range(cfg, "A2:Z")}:clear`, { method: "POST", body: "{}" });
  if (rows.length) {
    await api(cfg, `/values/${range(cfg, "A2")}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: rows }),
    });
  }
  return { written: rows.length };
}

/** 어드민에 띄울 시트 주소 */
export function sheetUrl(): string | null {
  const cfg = config();
  return cfg ? `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/edit` : null;
}
