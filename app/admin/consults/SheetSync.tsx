"use client";

import { useState } from "react";

/** 저장소에만 있고 시트에 빠진 상담신청을 채우는 버튼 */
export default function SheetSync({ url }: { url: string | null }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!url) {
    return <span className="hint" style={{ margin: 0 }}>구글 시트 미연결</span>;
  }

  async function sync() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/consults/sheet-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "시트에 쓰지 못했습니다.");
      setMsg(data.added ? `${data.added}건을 시트에 채웠습니다.` : "시트가 이미 최신입니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "시트에 쓰지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a className="btn" href={url} target="_blank" rel="noreferrer">
        구글 시트 열기
      </a>
      <button className="btn" type="button" disabled={busy} onClick={sync}>
        {busy ? "맞추는 중…" : "시트와 맞추기"}
      </button>
      {msg ? <span className="hint" style={{ margin: 0, alignSelf: "center" }}>{msg}</span> : null}
    </>
  );
}
