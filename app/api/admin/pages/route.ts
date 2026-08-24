import { NextResponse } from "next/server";
import { getPages, savePages } from "@/lib/store";
import { blankPage } from "@/lib/types";

export const dynamic = "force-dynamic";

/** 후기 페이지 목록 */
export async function GET() {
  return NextResponse.json(await getPages());
}

/** 새 후기 페이지 추가 */
export async function POST() {
  const pages = await getPages();
  const page = blankPage();
  page.title = "제목 없는 후기 페이지";
  page.updatedAt = new Date().toISOString();
  await savePages([...pages, page]);
  return NextResponse.json(page, { status: 201 });
}
