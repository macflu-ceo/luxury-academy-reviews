"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로그인하지 못했습니다.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인하지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <h1>관리자</h1>
      <p>후기 페이지를 수정하려면 비밀번호를 입력하세요.</p>
      <form onSubmit={submit}>
        <input
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          placeholder="비밀번호"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="submit" type="submit" disabled={busy}>
          {busy ? "확인 중…" : "로그인"}
        </button>
        {error ? <p className="msg err">{error}</p> : null}
      </form>
    </div>
  );
}
