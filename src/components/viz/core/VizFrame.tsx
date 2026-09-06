import { cx } from "@/lib/utils";

/**
 * กรอบมาตรฐานของทุก visualization: หัวเรื่อง + พื้นที่กราฟ + แผงควบคุม + ค่าที่อ่านได้
 * บังคับให้ทุกภาพมี "ตัวเลขกำกับ" ตามเกณฑ์การเข้าถึง
 */
export function VizFrame({
  title,
  caption,
  canvas,
  controls,
  readout,
  className,
}: {
  title: string;
  caption?: string;
  canvas: React.ReactNode;
  controls?: React.ReactNode;
  readout?: React.ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cx("my-6 overflow-hidden rounded-lg border border-line bg-surface", className)}
    >
      <figcaption className="border-b border-line px-4 py-2.5">
        <p className="m-0 font-display text-[14.5px] font-semibold text-ink">{title}</p>
        {caption ? <p className="m-0 text-[13px] leading-snug text-ink-3">{caption}</p> : null}
      </figcaption>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_248px]">
        <div className="min-w-0 p-3">{canvas}</div>
        {controls || readout ? (
          <div className="flex flex-col gap-4 border-t border-line bg-surface-2 p-4 lg:border-t-0 lg:border-l">
            {controls}
            {readout}
          </div>
        ) : null}
      </div>
    </figure>
  );
}

export function Readout({ rows }: { rows: Array<{ label: string; value: string; tone?: "delta" }> }) {
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-line pt-3 font-mono text-[12.5px]">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-ink-3">{r.label}</dt>
          <dd
            className={cx(
              "m-0 text-right tabular-nums",
              r.tone === "delta" ? "text-delta" : "text-ink",
            )}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
