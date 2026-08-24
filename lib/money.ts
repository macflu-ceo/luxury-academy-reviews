/** "2450000" → "2,450,000원". 숫자가 아니면 적은 그대로 돌려준다. */
export function money(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "";
  const digits = v.replace(/[,\s원]/g, "");
  if (!/^-?\d+$/.test(digits)) return v;
  return `${Number(digits).toLocaleString("ko-KR")}원`;
}

/** 공백/콤마/원 을 걷어낸 숫자. 숫자가 아니면 null. */
export function num(raw: string): number | null {
  const digits = (raw || "").replace(/[,\s원]/g, "");
  if (!/^-?\d+$/.test(digits)) return null;
  return Number(digits);
}

/** 마진을 직접 적었으면 그 값, 비워뒀으면 정가 - 공급가. */
export function resolveMargin(supply: string, retail: string, margin: string): string {
  if (margin && margin.trim()) return money(margin);
  const s = num(supply);
  const r = num(retail);
  if (s === null || r === null) return "";
  return money(String(r - s));
}
