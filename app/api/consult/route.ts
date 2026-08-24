import { NextResponse } from "next/server";
import { addConsult } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; phone?: string; capital?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 40);
  const phone = (body.phone || "").trim().slice(0, 20);
  const capital = (body.capital || "").trim().slice(0, 30);
  const source = (body.source || "").trim().slice(0, 60);

  if (!name) return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10)
    return NextResponse.json({ error: "전화번호를 정확히 입력해 주세요." }, { status: 400 });
  if (!capital)
    return NextResponse.json({ error: "자본금 규모를 선택해 주세요." }, { status: 400 });

  try {
    await addConsult({
      createdAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      name,
      phone,
      capital,
      source,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[consult] 저장 실패:", e);
    return NextResponse.json(
      { error: "접수 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
