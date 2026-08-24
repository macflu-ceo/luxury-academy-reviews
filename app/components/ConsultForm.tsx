"use client";

import { useState } from "react";
import type { Content } from "@/lib/types";

type Props = { form: Content["form"] };

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function ConsultForm({ form }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [capital, setCapital] = useState("");
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("이름을 입력해 주세요.");
    if (phone.replace(/\D/g, "").length < 10)
      return setError("전화번호를 정확히 입력해 주세요.");
    if (!capital) return setError("자본금 규모를 선택해 주세요.");
    if (!agree) return setError("개인정보 수집·이용에 동의해 주세요.");

    setSending(true);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          capital,
          source:
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("utm_source") || ""
              : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "잠시 후 다시 시도해 주세요.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="consult" id="consult">
      <div className="consult-box">
        {done ? (
          <div className="done">
            <div className="mark">✓</div>
            <h2>신청이 접수됐습니다</h2>
            <p>{form.doneText}</p>
          </div>
        ) : (
          <>
            <h2>{form.title}</h2>
            {form.note ? <p className="note">{form.note}</p> : null}

            <form className="form-grid" onSubmit={submit} noValidate>
              <div className="f">
                <label htmlFor="cName">이름</label>
                <input
                  id="cName"
                  type="text"
                  value={name}
                  autoComplete="name"
                  placeholder="홍길동"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="f">
                <label htmlFor="cPhone">전화번호</label>
                <input
                  id="cPhone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  autoComplete="tel"
                  placeholder="010-1234-5678"
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                />
              </div>

              <div className="f">
                <label htmlFor="cCapital">자본금 규모</label>
                <select
                  id="cCapital"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                >
                  <option value="">선택해 주세요</option>
                  {form.capitalOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <label className="agree">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>{form.privacyText}</span>
              </label>

              <button className="submit" type="submit" disabled={sending}>
                {sending ? "보내는 중…" : "상담 신청하기"}
              </button>

              {error ? <p className="msg err">{error}</p> : null}
            </form>
          </>
        )}
      </div>
    </section>
  );
}
