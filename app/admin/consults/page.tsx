import Link from "next/link";
import { listConsults } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ConsultsPage() {
  const rows = (await listConsults()).slice().reverse();

  return (
    <div className="admin">
      <div className="wide">
        <div className="admin-head">
          <div>
            <h1>상담신청</h1>
            <p>최근 신청이 위에 옵니다. 신청 시각은 한국 시간 기준입니다.</p>
          </div>
          <div className="admin-actions">
            <Link className="btn" href="/admin">
              후기 편집
            </Link>
            <Link className="btn" href="/" target="_blank">
              페이지 보기
            </Link>
          </div>
        </div>

        <div className="panel" style={{ padding: "clamp(16px,3vw,24px)" }}>
          {rows.length === 0 ? (
            <p className="hint" style={{ margin: 0 }}>
              아직 접수된 상담신청이 없습니다.
            </p>
          ) : (
            <div className="scroll-x">
              <table className="list">
                <thead>
                  <tr>
                    <th>신청일시</th>
                    <th>이름</th>
                    <th>전화번호</th>
                    <th>자본금 규모</th>
                    <th>유입경로</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.createdAt}-${i}`}>
                      <td>{r.createdAt}</td>
                      <td>{r.name}</td>
                      <td>
                        <a href={`tel:${r.phone.replace(/\D/g, "")}`}>{r.phone}</a>
                      </td>
                      <td>{r.capital}</td>
                      <td>{r.source || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="hint" style={{ marginTop: 16 }}>
          모두 {rows.length}건
        </p>
      </div>
    </div>
  );
}
