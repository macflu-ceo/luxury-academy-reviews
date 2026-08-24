import { NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/store";
import { Content, DEFAULT_CONTENT } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getContent());
}

export async function PUT(req: Request) {
  let body: Partial<Content>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "전체 제목을 입력해 주세요." }, { status: 400 });
  }

  try {
    await saveContent({ ...DEFAULT_CONTENT, ...body } as Content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/content] 저장 실패:", e);
    return NextResponse.json(
      { error: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
