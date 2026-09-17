import { NextResponse } from "next/server";
import { listConsults } from "@/lib/store";
import { rebuildSheet, sheetsEnabled, syncConsultsToSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * 저장소의 상담신청 중 시트에 빠진 것만 채운다. 여러 번 눌러도 중복되지 않는다.
 * ?mode=rebuild 면 탭을 통째로 다시 쓴 뒤 빠진 것을 한 번 더 채운다 (열 구성 변경용).
 */
export async function POST(req: Request) {
  if (!sheetsEnabled()) {
    return NextResponse.json(
      { error: "구글 시트가 연결되지 않았습니다. Vercel 환경변수를 확인해 주세요." },
      { status: 400 },
    );
  }
  try {
    if (new URL(req.url).searchParams.get("mode") === "rebuild") {
      const { written } = await rebuildSheet(await listConsults());
      const { added, total } = await syncConsultsToSheet(await listConsults());
      return NextResponse.json({ written, added, total });
    }
    return NextResponse.json(await syncConsultsToSheet(await listConsults()));
  } catch (e) {
    console.error("[sheets] 동기화 실패:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "시트에 쓰지 못했습니다." },
      { status: 500 },
    );
  }
}
