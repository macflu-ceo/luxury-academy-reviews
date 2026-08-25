"use client";

import { useCallback, useEffect, useState } from "react";

type Shot = { src: string; caption: string; kind: "product" | "receipt" };

/**
 * 상품 사진과 판매 내역을 나란히 놓는다.
 * 목록에서는 같은 크기로 잘라 보여주고, 누르면 원본 전체를 크게 띄운다.
 */
export default function Figures({
  product,
  receipt,
  alt,
}: {
  product: string;
  receipt: string;
  alt: string;
}) {
  const [open, setOpen] = useState<Shot | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const shots: Shot[] = [
    { src: product, caption: "상품", kind: "product" },
    { src: receipt, caption: "판매 내역", kind: "receipt" },
  ].filter((s): s is Shot => Boolean(s.src));

  if (!shots.length) return null;

  return (
    <>
      <div className={shots.length === 1 ? "figs one" : "figs"}>
        {shots.map((s) => (
          <figure className={`fig ${s.kind}`} key={s.caption}>
            <button
              type="button"
              className="fig-btn"
              onClick={() => setOpen(s)}
              aria-label={`${s.caption} 사진 크게 보기`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={`${alt} ${s.caption}`} />
              <span className="zoom" aria-hidden="true">
                ⤢
              </span>
            </button>
            <figcaption>{s.caption}</figcaption>
          </figure>
        ))}
      </div>

      {open ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
          <button type="button" className="lightbox-close" onClick={close} aria-label="닫기">
            ✕
          </button>
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.src} alt={`${alt} ${open.caption}`} />
          </div>
          <p className="lightbox-cap">
            {open.caption} · 밀어서 보고, 바깥을 누르면 닫힙니다
          </p>
        </div>
      ) : null}
    </>
  );
}
