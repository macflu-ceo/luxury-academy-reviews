import { NextResponse } from "next/server";
import { addConsult } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; phone?: string; capital?: string; source?: string; page?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 40);
  const phone = (body.phone || "").trim().slice(0, 20);
  const capital = (body.capital || "").trim().slice(0, 30);
  const source = (body.source || "").trim().slice(0, 60);
  const page = (body.page || "").trim().slice(0, 60);

  if (!name) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10)
    return NextResponse.json({ error: "전화번호를 정확히 입력해 주세요." }, { status: 400 });
  if (!capital)
    return NextResponse.json({ error: "자본금 규모를 선택해 주세요." }, { status: 400 });

  const stored = await addConsult({
    createdAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    page,
    name,
    phone,
    capital,
    source,
  });

  // 저장에 실패해도 신청자에게는 접수로 알린다. 내용은 로그에 [LEAD] 로 남아 있다.
  return NextResponse.json({ ok: true, stored });
}
