"use client";

import { fmt } from "@/lib/utils";

export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  /** คำอธิบายสั้น ๆ ว่าค่านี้ทำอะไรกับภาพ */
  hint?: string;
}

interface Props {
  specs: readonly ParamSpec[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onReset?: () => void;
}

/**
 * แถบควบคุมพารามิเตอร์ — ใช้ input[type=range] จริง จึงเลื่อนด้วยลูกศรบนคีย์บอร์ดได้
 * และมีตัวเลขกำกับเสมอ เพื่อให้คนที่มองกราฟไม่ออกยังอ่านค่าได้
 */
export function ParameterPanel({ specs, values, onChange, onReset }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {specs.map((s) => {
        const v = values[s.key] ?? 0;
        return (
          <div key={s.key}>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={`param-${s.key}`}
                className="font-mono text-[12.5px] font-medium text-ink-2"
              >
                {s.label}
              </label>
              <span className="font-mono text-[13px] tabular-nums text-accent-ink">{fmt(v)}</span>
            </div>
            <input
              id={`param-${s.key}`}
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={v}
              onChange={(e) => onChange(s.key, Number(e.target.value))}
            />
            {s.hint ? <p className="m-0 text-[12px] leading-snug text-ink-3">{s.hint}</p> : null}
          </div>
        );
      })}
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11.5px] text-ink-2 hover:border-line-strong hover:text-ink"
        >
          รีเซ็ตค่า
        </button>
      ) : null}
    </div>
  );
}
