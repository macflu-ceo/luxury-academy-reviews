import { getContent } from "@/lib/store";
import { money, resolveMargin } from "@/lib/money";
import ConsultForm from "./components/ConsultForm";

// 어드민에서 저장하면 바로 반영되도록 매 요청마다 그린다.
export const dynamic = "force-dynamic";

function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/).filter(Boolean);
  return (
    <div className="prose">
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

export default async function Page() {
  const c = await getContent();
  const showSticky = c.fixedCta && Boolean(c.closing.ctaLabel);

  return (
    <>
      <article>
        <header className="post-head page">
          {c.date ? <div className="datemark">{c.date}</div> : null}
          <h1>{c.title}</h1>
          {c.lead ? <p className="lead">{c.lead}</p> : null}
          <div className="head-rule" />
        </header>

        {c.cover ? (
          <div className="page">
            <div className="hero-img">
              {/* 외부 이미지 호스트가 바뀌어도 깨지지 않도록 img 태그를 그대로 쓴다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.cover} alt="" />
            </div>
          </div>
        ) : null}

        <div className="page">
          {c.entries.map((e) => (
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

          {c.closing.headline || c.closing.body ? (
            <section className="closing">
              {c.closing.headline ? <h2>{c.closing.headline}</h2> : null}
              {c.closing.body ? <p className="txt">{c.closing.body}</p> : null}
              {c.closing.ctaLabel ? (
                <a className="cta" href="#consult">
                  {c.closing.ctaLabel}
                </a>
              ) : null}
            </section>
          ) : null}

          <ConsultForm form={c.form} />

          <footer className="page-foot">
            <span>{c.footer}</span>
          </footer>

          {/* 하단 고정 버튼에 글이 가려지지 않도록 자리를 비워둔다 */}
          {showSticky ? <div className="sticky-space" /> : null}
        </div>
      </article>

      {showSticky ? (
        <div className="stickycta">
          <a href="#consult">{c.closing.ctaLabel}</a>
        </div>
      ) : null}
    </>
  );
}
