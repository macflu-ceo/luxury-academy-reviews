/**
 * 후기 페이지들과 상담신청을 저장한다.
 *
 * - Vercel: Blob 스토어에 JSON으로 저장한다 (BLOB_READ_WRITE_TOKEN 이 있을 때).
 *   경로를 reviews/ 아래로 분리해 두어 다른 프로젝트와 스토어를 같이 써도 섞이지 않는다.
 * - 로컬: .data/ 폴더에 파일로 저장한다. 아무 설정 없이 npm run dev 가 바로 돌아간다.
 *
 * 다른 저장소로 옮기려면 아래 네 함수만 바꿔 끼우면 된다.
 */
import fs from "fs/promises";
import path from "path";
import { del, list, put } from "@vercel/blob";
import { Consult, DEFAULT_PAGE, FALLBACK_PAGE, Page } from "./types";

const PAGES_KEY = "reviews/data/pages";
const CONSULT_KEY = "reviews/data/consults";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/* ────────────── Vercel Blob ────────────── */

/** 저장할 때마다 새 파일이 생긴다. 최근 몇 개는 지우지 않고 남겨 둔다. */
const KEEP_VERSIONS = 20;

async function blobRead<T>(prefix: string, fallback: T): Promise<T> {
  const { blobs } = await list({ prefix, limit: 1000 });
  if (!blobs.length) return fallback;

  // 페이지 쪽은 파일 목록이 잠깐 캐시될 수 있어서, 가장 새 파일이 이미 지워졌을 수 있다.
  // 읽히는 것이 나올 때까지 새것부터 차례로 시도한다.
  const sorted = [...blobs].sort(
    (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
  );
  for (const b of sorted) {
    try {
      const res = await fetch(b.url, { cache: "no-store" });
      if (res.ok) return (await res.json()) as T;
    } catch {
      // 다음 파일로
    }
  }
  // 파일은 있는데 하나도 못 읽었다. 빈 값으로 넘기면 상담신청 목록을 덮어써 버리므로 멈춘다.
  throw new Error(`[store] ${prefix}: 파일 ${sorted.length}개를 모두 읽지 못했습니다.`);
}

async function blobWrite(prefix: string, value: unknown): Promise<void> {
  await put(`${prefix}.json`, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
  // 바로 지우면 캐시된 목록이 지워진 파일을 가리켜 페이지가 깨진다. 오래된 것만 정리한다.
  const { blobs } = await list({ prefix, limit: 1000 });
  const stale = [...blobs]
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(KEEP_VERSIONS);
  if (stale.length) await del(stale.map((b) => b.url)).catch(() => {});
}

/* ────────────── 로컬 파일 ────────────── */

const DATA_DIR = path.join(process.cwd(), ".data");

async function fileRead<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function fileWrite(name: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, name), JSON.stringify(value, null, 2), "utf8");
}

/* ────────────── 후기 페이지 ────────────── */

function normalize(raw: unknown): Page[] {
  if (Array.isArray(raw)) {
    return raw.map((p, i) => ({
      ...DEFAULT_PAGE,
      ...(p as Partial<Page>),
      id: (p as Page).id || `p${i + 1}`,
    }));
  }
  // 페이지가 하나뿐이던 예전 형식을 목록으로 올린다
  if (raw && typeof raw === "object") {
    return [{ ...DEFAULT_PAGE, ...(raw as Partial<Page>) }];
  }
  return [DEFAULT_PAGE];
}

/**
 * 인스턴스 메모리에 잠깐 들고 있는다. 방문자가 몰려도 저장소를 매번 읽지 않는다.
 * 한 번이라도 제대로 읽었으면, 이후 읽기가 실패해도 그 내용을 계속 보여준다.
 * 비상 화면(상담신청만)은 한 번도 읽지 못한 경우에만 나온다.
 */
const MEMO_MS = 15_000;
let memo: { at: number; pages: Page[] } | null = null;

async function readPagesOnce(): Promise<Page[] | null> {
  const raw = useBlob()
    ? await blobRead<unknown>(PAGES_KEY, null)
    : await fileRead<unknown>("pages.json", null);
  return raw ? normalize(raw) : null;
}

export async function getPages(): Promise<Page[]> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.pages;

  const isServerless = Boolean(process.env.VERCEL);

  if (isServerless && !useBlob()) {
    console.error("[store] BLOB_READ_WRITE_TOKEN 이 없습니다. 저장소가 연결되지 않았습니다.");
    return memo?.pages ?? [FALLBACK_PAGE];
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const pages = await readPagesOnce();
      if (pages) {
        memo = { at: Date.now(), pages };
        return pages;
      }
      break; // 저장된 파일 자체가 없음
    } catch (e) {
      console.error(`[store] 후기 페이지 읽기 실패 (${attempt}/3):`, e);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }

  if (memo) {
    // 읽기는 실패했지만 직전 정상 내용이 있다. 비상 화면으로 떨어지지 않는다.
    memo = { at: Date.now(), pages: memo.pages };
    return memo.pages;
  }
  return isServerless ? [FALLBACK_PAGE] : [DEFAULT_PAGE];
}

export async function savePages(pages: Page[]): Promise<void> {
  if (useBlob()) await blobWrite(PAGES_KEY, pages);
  else await fileWrite("pages.json", pages);
  memo = { at: Date.now(), pages };
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const pages = await getPages();
  const hit = pages.find((p) => p.slug === slug);
  if (hit) return hit;

  // 저장소를 못 읽은 상태라면 404 를 내지 않는다.
  // 문자로 받은 주소가 잠깐이라도 404 가 되면 그 사람은 다시 안 들어온다.
  if (pages.length === 1 && pages[0].id === "fallback") return pages[0];
  return null;
}

/** 가장 나중에 만든 페이지. 주소 없이 접속했을 때 보여준다. */
export async function getLatestPage(): Promise<Page | null> {
  const pages = await getPages();
  return pages.length ? pages[pages.length - 1] : null;
}

/* ────────────── 상담신청 ────────────── */

export async function listConsults(): Promise<Consult[]> {
  try {
    const rows = useBlob()
      ? await blobRead<Consult[]>(CONSULT_KEY, [])
      : await fileRead<Consult[]>("consults.json", []);
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.error("[store] 상담신청을 불러오지 못했습니다:", e);
    return [];
  }
}

/**
 * 상담신청을 저장한다. 저장에 실패하면 예외를 던지지 않고 false 를 돌려준다.
 * 대신 로그에 [LEAD] 로 남겨 두어 나중에 Vercel 로그에서 건져낼 수 있게 한다.
 * 발송 중에 신청자가 오류 화면을 보고 이탈하는 것이 더 큰 손해다.
 */
export async function addConsult(c: Consult): Promise<boolean> {
  // 저장 성공 여부와 무관하게 먼저 로그로 남긴다
  console.error("[LEAD]", JSON.stringify(c));
  try {
    const all = await listConsults();
    all.push(c);
    if (useBlob()) await blobWrite(CONSULT_KEY, all);
    else await fileWrite("consults.json", all);
    return true;
  } catch (e) {
    console.error("[store] 상담신청을 저장하지 못했습니다:", e);
    return false;
  }
}
