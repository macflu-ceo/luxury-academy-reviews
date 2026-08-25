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

async function blobRead<T>(prefix: string, fallback: T): Promise<T> {
  const { blobs } = await list({ prefix, limit: 100 });
  if (!blobs.length) return fallback;
  const latest = [...blobs].sort(
    (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
  )[0];
  const res = await fetch(latest.url, { cache: "no-store" });
  if (!res.ok) return fallback;
  return (await res.json()) as T;
}

async function blobWrite(prefix: string, value: unknown): Promise<void> {
  const { blobs } = await list({ prefix, limit: 100 });
  await put(`${prefix}.json`, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
  });
  // 새 파일을 쓴 뒤에 이전 파일을 지운다 (중간에 실패해도 데이터가 남도록)
  if (blobs.length) await del(blobs.map((b) => b.url)).catch(() => {});
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

export async function getPages(): Promise<Page[]> {
  // 배포 환경인데 저장소가 안 붙어 있으면 샘플 후기를 보여주면 안 된다.
  // 실제 고객이 지어낸 후기를 읽게 된다.
  const isServerless = Boolean(process.env.VERCEL);
  const onFailure = () => (isServerless ? [FALLBACK_PAGE] : [DEFAULT_PAGE]);

  if (isServerless && !useBlob()) {
    console.error("[store] BLOB_READ_WRITE_TOKEN 이 없습니다. 저장소가 연결되지 않았습니다.");
    return onFailure();
  }

  try {
    const raw = useBlob()
      ? await blobRead<unknown>(PAGES_KEY, null)
      : await fileRead<unknown>("pages.json", null);
    if (!raw) return isServerless ? onFailure() : [DEFAULT_PAGE];
    return normalize(raw);
  } catch (e) {
    console.error("[store] 후기 페이지를 불러오지 못했습니다:", e);
    return onFailure();
  }
}

export async function savePages(pages: Page[]): Promise<void> {
  if (useBlob()) await blobWrite(PAGES_KEY, pages);
  else await fileWrite("pages.json", pages);
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) || null;
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
