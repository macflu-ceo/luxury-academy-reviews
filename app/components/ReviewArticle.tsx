import type { Page } from "@/lib/types";
import { money, resolveMargin } from "@/lib/money";
import ConsultForm from "./ConsultForm";

function Prose({ text, className }: { text: string; className?: string }) {
  const blocks = text.trim().split(/\n{2,}/).filter(Boolean);
  if (!blocks.length) return null;
  return (
    <div className={className ? `prose ${className}` : "prose"}>
      {blocks.map((b, i) => (
        <p key={i}>
          {b.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function Spec({ supply, retail, margin }: { supply: string; retail: string; margin: string }) {
  const rows = [
    { k: "공급가", v: money(supply) },
    { k: "정가", v: money(retail) },
    { k: "마진", v: resolveMargin(supply, retail, margin), accent: true },
  ].filter((r) => r.v);

  if (!rows.length) return null;
  return (
    <dl className="spec">
      {rows.map((r) => (
        <div key={r.k} className={r.accent ? "spec-row accent" : "spec-row"}>
          <dt>{r.k}</dt>
          <dd>{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ReviewArticle({ page }: { page: Page }) {
  const showSticky = page.fixedCta && Boolean(page.closing.ctaLabel);

  return (
    <>
      <article>
        <header className="post-head page">
          {page.date ? <div className="datemark">{page.date}</div> : null}
          <h1>{page.title}</h1>
          <Prose text={page.lead} className="lead" />
          <div className="head-rule" />
        </header>

        {page.cover ? (
          <div className="page">
            <div className="hero-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.cover} alt="" />
            </div>
          </div>
        ) : null}

        <div className="page">
          {page.entries.map((e) => (
            <section className="entry" key={e.id}>
              {e.title ? <h2>{e.title}</h2> : null}
              {e.image ? (
                <div className="entry-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.image} alt={e.title} />
                </div>
              ) : null}
              <Spec supply={e.supply} retail={e.retail} margin={e.margin} />
              <Prose text={e.body} />
            </section>
          ))}

          {page.closing.headline || page.closing.body ? (
            <section className="closing">
              {page.closing.headline ? <h2>{page.closing.headline}</h2> : null}
              <Prose text={page.closing.body} className="txt" />
              {page.closing.ctaLabel ? (
                <a className="cta" href="#consult">
                  {page.closing.ctaLabel}
                </a>
              ) : null}
            </section>
          ) : null}

          <ConsultForm form={page.form} pageSlug={page.slug} />

          <footer className="page-foot">
            <span>{page.footer}</span>
          </footer>

          {/* 하단 고정 버튼에 글이 가려지지 않도록 자리를 비워둔다 */}
          {showSticky ? <div className="sticky-space" /> : null}
        </div>
      </article>

      {showSticky ? (
        <div className="stickycta">
          <a href="#consult">{page.closing.ctaLabel}</a>
        </div>
      ) : null}
    </>
  );
}
