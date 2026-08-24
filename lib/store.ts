/**
 * 후기 내용과 상담신청을 저장한다.
 *
 * - Vercel: Blob 스토어에 JSON으로 저장한다 (BLOB_READ_WRITE_TOKEN 이 있을 때).
 *   파일 이름에 임의 문자열이 붙어 주소를 추측할 수 없고, 읽고 쓰는 데는 토큰이 필요하다.
 * - 로컬: .data/ 폴더에 파일로 저장한다. 아무 설정 없이 npm run dev 가 바로 돌아간다.
 *
 * 구글시트 연동은 나중에 이 파일의 함수 네 개(getContent/saveContent/addConsult/listConsults)만
 * 바꿔 끼우면 된다. 나머지 코드는 손댈 필요가 없다.
 */
import fs from "fs/promises";
import path from "path";
import { del, list, put } from "@vercel/blob";
import { Consult, Content, DEFAULT_CONTENT } from "./types";

// Blob 스토어를 다른 프로젝트와 같이 써도 섞이지 않도록 경로를 분리한다.
const CONTENT_KEY = "reviews/data/content";
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
  if (blobs.length) {
    await del(blobs.map((b) => b.url)).catch(() => {});
  }
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

/* ────────────── 후기 내용 ────────────── */

export async function getContent(): Promise<Content> {
  try {
    const saved = useBlob()
      ? await blobRead<Partial<Content> | null>(CONTENT_KEY, null)
      : await fileRead<Partial<Content> | null>("content.json", null);
    return saved ? { ...DEFAULT_CONTENT, ...saved } : DEFAULT_CONTENT;
  } catch (e) {
    console.error("[store] 후기 내용을 불러오지 못했습니다:", e);
    return DEFAULT_CONTENT;
  }
}

export async function saveContent(content: Content): Promise<void> {
  if (useBlob()) await blobWrite(CONTENT_KEY, content);
  else await fileWrite("content.json", content);
}

/* ────────────── 상담신청 ────────────── */

export async function listConsults(): Promise<Consult[]> {
  try {
    const list_ = useBlob()
      ? await blobRead<Consult[]>(CONSULT_KEY, [])
      : await fileRead<Consult[]>("consults.json", []);
    return Array.isArray(list_) ? list_ : [];
  } catch (e) {
    console.error("[store] 상담신청을 불러오지 못했습니다:", e);
    return [];
  }
}

export async function addConsult(c: Consult): Promise<void> {
  const all = await listConsults();
  all.push(c);
  if (useBlob()) await blobWrite(CONSULT_KEY, all);
  else await fileWrite("consults.json", all);
}
