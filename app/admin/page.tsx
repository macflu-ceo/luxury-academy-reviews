"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Page } from "@/lib/types";

export default function AdminHome() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/pages");
      setPages(await res.json());
    } catch {
      setMsg("목록을 불러오지 못했습니다.");
    }
  }

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/pages", { method: "POST" });
      const page = await res.json();
      if (!res.ok) throw new Error(page.error || "만들지 못했습니다.");
      router.push(`/admin/pages/${page.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "만들지 못했습니다.");
      setBusy(false);
    }
  }

  async function remove(p: Page) {
    if (!confirm(`“${p.title || "제목 없는 후기 페이지"}”를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const res = await fetch(`/api/admin/pages/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      setMsg("삭제하지 못했습니다.");
      return;
    }
    setMsg("삭제했습니다.");
    load();
  }

  async function copyLink(slug: string) {
    const url = `${location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("문자로 보낼 주소를 복사했습니다.");
    } catch {
      prompt("이 주소를 복사해 보내세요", url);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }

  return (
    <div className="admin">
      <div className="wide">
        <div className="admin-head">
          <div>
            <h1>후기 페이지</h1>
            <p>페이지 하나가 문자로 보내는 글 한 편입니다. 눌러서 내용을 씁니다.</p>
          </div>
          <div className="admin-actions">
            <button className="btn primary" type="button" disabled={busy} onClick={create}>
              {busy ? "만드는 중…" : "+ 새 후기 페이지"}
            </button>
            <Link className="btn" href="/admin/consults">
              상담신청 보기
            </Link>
            <button className="btn ghost" type="button" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>

        {msg ? <p className="banner">{msg}</p> : null}

        {pages === null ? (
          <p className="hint" style={{ marginTop: 24 }}>
            불러오는 중…
          </p>
        ) : pages.length === 0 ? (
          <p className="hint" style={{ marginTop: 24 }}>
            아직 후기 페이지가 없습니다. 오른쪽 위 버튼으로 첫 페이지를 만드세요.
          </p>
        ) : (
          <div className="page-list">
            {pages.map((p) => (
              <div className="page-card" key={p.id}>
                <Link className="page-card-main" href={`/admin/pages/${p.id}`}>
                  <div className="thumb">
                    {p.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover} alt="" />
                    ) : (
                      <span>사진 없음</span>
                    )}
                  </div>
                  <div className="page-card-body">
                    <span className="k">{p.date || "날짜 미입력"}</span>
                    <h2>{p.title || "제목 없는 후기 페이지"}</h2>
                    <p className="sum">{p.lead || "소개글이 비어 있습니다."}</p>
                    <span className="k">
                      후기글 {p.entries.length}개 · 주소 /{p.slug}
                    </span>
                  </div>
                </Link>
                <div className="page-card-acts">
                  <Link className="btn sm" href={`/${p.slug}`} target="_blank">
                    미리보기
                  </Link>
                  <button className="btn sm" type="button" onClick={() => copyLink(p.slug)}>
                    주소 복사
                  </button>
                  <button
                    className="btn sm ghost danger"
                    type="button"
                    onClick={() => remove(p)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
