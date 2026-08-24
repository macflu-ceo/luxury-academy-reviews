import { NextResponse } from "next/server";
import { getPages, savePages } from "@/lib/store";
import { cleanSlug, DEFAULT_PAGE, Page } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const page = (await getPages()).find((p) => p.id === params.id);
  if (!page) {
    return NextResponse.json({ error: "후기 페이지를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(page);
}

export async function PUT(req: Request, { params }: Ctx) {
  let body: Partial<Page>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.title || !String(body.title).trim()) {
    return NextResponse.json({ error: "전체 제목을 입력해 주세요." }, { status: 400 });
  }

  const pages = await getPages();
  const index = pages.findIndex((p) => p.id === params.id);
  if (index < 0) {
    return NextResponse.json({ error: "후기 페이지를 찾을 수 없습니다." }, { status: 404 });
  }

  const slug = cleanSlug(body.slug || pages[index].slug);
  if (!slug) {
    return NextResponse.json({ error: "주소 이름을 입력해 주세요." }, { status: 400 });
  }
  if (pages.some((p, i) => i !== index && p.slug === slug)) {
    return NextResponse.json(
      { error: `주소 "${slug}" 는 다른 페이지가 쓰고 있습니다.` },
      { status: 409 },
    );
  }

  pages[index] = {
    ...DEFAULT_PAGE,
    ...body,
    id: params.id,
    slug,
    updatedAt: new Date().toISOString(),
  } as Page;

  try {
    await savePages(pages);
    return NextResponse.json(pages[index]);
  } catch (e) {
    console.error("[admin/pages] 저장 실패:", e);
    return NextResponse.json(
      { error: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const pages = await getPages();
  const next = pages.filter((p) => p.id !== params.id);
  if (next.length === pages.length) {
    return NextResponse.json({ error: "후기 페이지를 찾을 수 없습니다." }, { status: 404 });
  }
  await savePages(next);
  return NextResponse.json({ ok: true });
}
