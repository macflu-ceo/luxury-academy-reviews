import { NextResponse } from "next/server";
import { listConsults } from "@/lib/store";
import { sheetsEnabled, syncConsultsToSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/** 저장소의 상담신청 중 시트에 빠진 것만 채운다. 여러 번 눌러도 중복되지 않는다. */
export async function POST() {
  if (!sheetsEnabled()) {
    return NextResponse.json(
      { error: "구글 시트가 연결되지 않았습니다. Vercel 환경변수를 확인해 주세요." },
      { status: 400 },
    );
  }
  try {
    const result = await syncConsultsToSheet(await listConsults());
    return NextResponse.json(result);
  } catch (e) {
    console.error("[sheets] 동기화 실패:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "시트에 쓰지 못했습니다." },
      { status: 500 },
    );
  }
}
