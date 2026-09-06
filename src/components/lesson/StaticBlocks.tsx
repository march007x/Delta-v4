import type { Block } from "@/content/schema";
import { renderMath, renderRich } from "@/lib/math/render";
import { Callout } from "@/components/ui/Callout";

/**
 * บล็อกที่เรนเดอร์เป็น HTML นิ่ง ๆ ล้วน ไม่มี component ฝั่ง client เลย
 *
 * แยกไฟล์ออกมาเพื่อให้หน้าที่ใช้แค่สูตรกับตาราง (เช่น /formulas)
 * ไม่ต้องดึงทะเบียนกราฟและควิซทั้งชุดลงไปในบันเดิล
 */

export function MathBlock({ latex, note }: { latex: string; note?: string }) {
  return (
    <div className="my-4">
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: renderMath(latex, true) }}
      />
      {note ? <p className="m-0 text-center font-mono text-[12px] text-ink-3">{note}</p> : null}
    </div>
  );
}

export function TableBlock({
  caption,
  headers,
  rows,
}: {
  caption?: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <figure className="my-5 overflow-hidden rounded-lg border border-line bg-surface">
      {caption ? (
        <figcaption
          className="border-b border-line bg-surface-2 px-4 py-2.5 font-display text-[14px] font-semibold text-ink"
          dangerouslySetInnerHTML={{ __html: renderRich(caption) }}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[15px]">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-line-strong bg-surface-2 px-4 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.1em] whitespace-nowrap text-ink-3"
                  dangerouslySetInnerHTML={{ __html: renderRich(h) }}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`border-b border-line px-4 py-2.5 align-top leading-relaxed ${
                      j === 0 ? "font-medium text-ink" : "text-ink-2"
                    }`}
                    dangerouslySetInnerHTML={{ __html: renderRich(cell) }}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function CalloutBlock({
  tone,
  title,
  text,
}: {
  tone: "note" | "tip" | "warn" | "mistake" | "rule";
  title?: string;
  text: string;
}) {
  return (
    <Callout tone={tone} title={title}>
      <p
        className="m-0 text-[15px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderRich(text) }}
      />
    </Callout>
  );
}

/** เรนเดอร์เฉพาะบล็อกนิ่ง — บล็อกชนิดอื่นจะไม่แสดงอะไรเลย */
export function StaticBlock({ block }: { block: Block }) {
  if (block.kind === "math") return <MathBlock latex={block.latex} note={block.note} />;
  if (block.kind === "table")
    return <TableBlock caption={block.caption} headers={block.headers} rows={block.rows} />;
  if (block.kind === "callout")
    return <CalloutBlock tone={block.tone} title={block.title} text={block.text} />;
  return null;
}
