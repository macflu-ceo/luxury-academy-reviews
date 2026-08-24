"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Content, Entry } from "@/lib/types";
import { resolveMargin } from "@/lib/money";

function newEntry(): Entry {
  return {
    id: `e${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    image: "",
    body: "",
    supply: "",
    retail: "",
    margin: "",
  };
}

export default function AdminPage() {
  const [c, setC] = useState<Content | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string>("");
  const fileTarget = useRef<{ kind: "cover" | "entry"; index: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then(setC)
      .catch(() => setMsg("내용을 불러오지 못했습니다."));
  }, []);

  function patch(next: Partial<Content>) {
    setC((prev) => (prev ? { ...prev, ...next } : prev));
  }

  function patchEntry(i: number, next: Partial<Entry>) {
    setC((prev) => {
      if (!prev) return prev;
      const entries = prev.entries.slice();
      entries[i] = { ...entries[i], ...next };
      return { ...prev, entries };
    });
  }

  function moveEntry(i: number, dir: -1 | 1) {
    setC((prev) => {
      if (!prev) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.entries.length) return prev;
      const entries = prev.entries.slice();
      [entries[i], entries[j]] = [entries[j], entries[i]];
      return { ...prev, entries };
    });
  }

  function removeEntry(i: number) {
    if (!c) return;
    if (!confirm(`“${c.entries[i].title || "제목 없는 후기글"}”을 삭제할까요?`)) return;
    patch({ entries: c.entries.filter((_, k) => k !== i) });
  }

  function pickImage(kind: "cover" | "entry", index = -1) {
    fileTarget.current = { kind, index };
    fileInput.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = fileTarget.current;
    if (!file || !target) return;

    setUploading(target.kind === "cover" ? "cover" : `e${target.index}`);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "사진을 올리지 못했습니다.");
      if (target.kind === "cover") patch({ cover: data.url });
      else patchEntry(target.index, { image: data.url });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "사진을 올리지 못했습니다.");
    } finally {
      setUploading("");
    }
  }

  async function save() {
    if (!c) return;
    if (!c.title.trim()) {
      setMsg("전체 제목을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(c),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "저장하지 못했습니다.");
      setMsg("저장했습니다.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }

  if (!c) {
    return (
      <div className="admin">
        <div className="wide">
          <p className="hint">{msg || "불러오는 중…"}</p>
        </div>
      </div>
    );
  }

  const imageRow = (label: string, url: string, kind: "cover" | "entry", index = -1) => {
    const key = kind === "cover" ? "cover" : `e${index}`;
    return (
      <div className="field">
        <label>{label}</label>
        <div className="drop">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="prev" src={url} alt="" />
          ) : (
            <span className="prev empty">없음</span>
          )}
          <div className="acts">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn sm"
                disabled={uploading === key}
                onClick={() => pickImage(kind, index)}
              >
                {uploading === key ? "올리는 중…" : "사진 선택"}
              </button>
              {url ? (
                <button
                  type="button"
                  className="btn sm ghost danger"
                  onClick={() =>
                    kind === "cover" ? patch({ cover: "" }) : patchEntry(index, { image: "" })
                  }
                >
                  제거
                </button>
              ) : null}
            </div>
            <span className="fn">가로가 긴 사진 권장 · 8MB 이하</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin">
      <div className="wide">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={onFile}
        />

        <div className="admin-head">
          <div>
            <h1>후기 페이지 관리</h1>
            <p>
              맨 위 제목·소개글부터 후기글, 상담신청 폼까지 전부 여기서 씁니다. 후기글은 쓴
              순서대로 페이지에 쌓입니다.
            </p>
          </div>
          <div className="admin-actions">
            <Link className="btn primary" href="/" target="_blank">
              페이지 보기
            </Link>
            <Link className="btn" href="/admin/consults">
              상담신청 보기
            </Link>
            <button className="btn ghost" type="button" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>

        <div className="panel">
          {/* ── 페이지 상단 ───────────────────────────── */}
          <fieldset>
            <legend>페이지 상단</legend>
            <p className="hint">글 맨 위에 들어가는 날짜, 전체 제목, 소개 문단입니다.</p>
            <div className="row">
              <div className="row two">
                <div className="field">
                  <label htmlFor="date">날짜 표기</label>
                  <input
                    id="date"
                    type="text"
                    value={c.date}
                    placeholder="예) 2026년 8월"
                    onChange={(e) => patch({ date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="footer">맨 아래 표기</label>
                  <input
                    id="footer"
                    type="text"
                    value={c.footer}
                    placeholder="예) 명품창업사관학교"
                    onChange={(e) => patch({ footer: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="title">전체 제목</label>
                <input
                  id="title"
                  type="text"
                  value={c.title}
                  placeholder="예) 명품창업사관학교 후기"
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="lead">제목 밑 소개 내용</label>
                <textarea
                  id="lead"
                  style={{ minHeight: 90 }}
                  value={c.lead}
                  placeholder="이 페이지가 어떤 글인지 두세 문장으로"
                  onChange={(e) => patch({ lead: e.target.value })}
                />
              </div>
              {imageRow("대표 사진", c.cover, "cover")}
            </div>
          </fieldset>

          {/* ── 후기글 ────────────────────────────────── */}
          <fieldset>
            <legend>후기글</legend>
            <p className="hint">
              후기글 하나 = 제목 + 사진 + 공급가·정가·마진 + 내용. 금액은 비워두면 그 후기에는
              표시되지 않습니다.
            </p>

            {c.entries.map((e, i) => (
              <div className="entry-card" key={e.id}>
                <div className="entry-card-head">
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t">{e.title || "제목 없는 후기글"}</span>
                  <button
                    type="button"
                    className="btn sm ghost"
                    title="위로"
                    onClick={() => moveEntry(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    title="아래로"
                    onClick={() => moveEntry(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost danger"
                    onClick={() => removeEntry(i)}
                  >
                    삭제
                  </button>
                </div>

                <div className="entry-card-body">
                  <div className="field">
                    <label>제목</label>
                    <input
                      type="text"
                      value={e.title}
                      placeholder="예) 퇴근 후 하루 2시간, 4개월 만에 월 매출 1,870만원"
                      onChange={(ev) => patchEntry(i, { title: ev.target.value })}
                    />
                  </div>

                  {imageRow("사진", e.image, "entry", i)}

                  <div className="row three-money">
                    <div className="field">
                      <label>공급가</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={e.supply}
                        placeholder="2450000"
                        onChange={(ev) => patchEntry(i, { supply: ev.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>정가</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={e.retail}
                        placeholder="3900000"
                        onChange={(ev) => patchEntry(i, { retail: ev.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>마진</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={e.margin}
                        placeholder="비우면 자동 계산"
                        onChange={(ev) => patchEntry(i, { margin: ev.target.value })}
                      />
                      <span className="sub">
                        {resolveMargin(e.supply, e.retail, e.margin)
                          ? `페이지 표시: ${resolveMargin(e.supply, e.retail, e.margin)}`
                          : "셋 다 비우면 이 후기에는 금액이 안 나옵니다"}
                      </span>
                    </div>
                  </div>

                  <div className="field">
                    <label>내용</label>
                    <textarea
                      value={e.body}
                      placeholder="빈 줄 하나로 문단이 나뉩니다"
                      onChange={(ev) => patchEntry(i, { body: ev.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn add-entry"
              onClick={() => patch({ entries: [...c.entries, newEntry()] })}
            >
              + 후기글 추가
            </button>
          </fieldset>

          {/* ── 마무리 ────────────────────────────────── */}
          <fieldset>
            <legend>마무리 · 상담신청 버튼</legend>
            <p className="hint">
              글 맨 아래 문구와 상담신청 버튼입니다. 버튼을 누르면 아래 상담신청 폼으로
              내려갑니다.
            </p>
            <div className="row">
              <div className="field">
                <label htmlFor="clh">마무리 문구</label>
                <input
                  id="clh"
                  type="text"
                  value={c.closing.headline}
                  placeholder="예) 고민하는 시간에도 누군가는 첫 건을 팝니다"
                  onChange={(e) =>
                    patch({ closing: { ...c.closing, headline: e.target.value } })
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="clb">보조 설명</label>
                <textarea
                  id="clb"
                  style={{ minHeight: 80 }}
                  value={c.closing.body}
                  onChange={(e) => patch({ closing: { ...c.closing, body: e.target.value } })}
                />
              </div>
              <div className="field">
                <label htmlFor="clc">상담신청 버튼 문구</label>
                <input
                  id="clc"
                  type="text"
                  value={c.closing.ctaLabel}
                  placeholder="상담 신청하기"
                  onChange={(e) =>
                    patch({ closing: { ...c.closing, ctaLabel: e.target.value } })
                  }
                />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={c.fixedCta}
                  onChange={(e) => patch({ fixedCta: e.target.checked })}
                />
                <span>휴대폰에서 화면 아래에 상담신청 버튼을 항상 띄웁니다</span>
              </label>
            </div>
          </fieldset>

          {/* ── 상담신청 폼 ──────────────────────────── */}
          <fieldset>
            <legend>상담신청 폼</legend>
            <p className="hint">
              받는 항목은 이름 · 전화번호 · 자본금 규모 세 가지입니다. 자본금 선택지는 한 줄에
              하나씩 적습니다.
            </p>
            <div className="row">
              <div className="row two">
                <div className="field">
                  <label htmlFor="ft">폼 제목</label>
                  <input
                    id="ft"
                    type="text"
                    value={c.form.title}
                    placeholder="상담 신청"
                    onChange={(e) => patch({ form: { ...c.form, title: e.target.value } })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="fn">안내 문구</label>
                  <input
                    id="fn"
                    type="text"
                    value={c.form.note}
                    placeholder="담당자가 순서대로 연락드립니다."
                    onChange={(e) => patch({ form: { ...c.form, note: e.target.value } })}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="fc">자본금 규모 선택지</label>
                <textarea
                  id="fc"
                  style={{ minHeight: 110 }}
                  value={c.form.capitalOptions.join("\n")}
                  onChange={(e) =>
                    patch({
                      form: {
                        ...c.form,
                        capitalOptions: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
                <span className="sub">한 줄에 하나씩. 위에서부터 순서대로 나옵니다.</span>
              </div>
              <div className="row two">
                <div className="field">
                  <label htmlFor="fp">개인정보 동의 문구</label>
                  <input
                    id="fp"
                    type="text"
                    value={c.form.privacyText}
                    onChange={(e) =>
                      patch({ form: { ...c.form, privacyText: e.target.value } })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="fd">신청 완료 문구</label>
                  <input
                    id="fd"
                    type="text"
                    value={c.form.doneText}
                    onChange={(e) => patch({ form: { ...c.form, doneText: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <div className="formbar">
            <button className="btn primary" type="button" disabled={saving} onClick={save}>
              {saving ? "저장 중…" : "저장하기"}
            </button>
            <span className="spacer" />
            {msg ? <span className="status">{msg}</span> : null}
            <span className="status">후기글 {c.entries.length}개</span>
          </div>
        </div>
      </div>
    </div>
  );
}
