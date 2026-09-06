"use client";

import { useMemo, useState } from "react";
import { VizFrame } from "./core/VizFrame";
import { cx } from "@/lib/utils";

type Fn = (p: boolean, q: boolean) => boolean;

interface Formula {
  key: string;
  label: string;
  f: Fn;
  note?: string;
}

const FORMULAS: Formula[] = [
  { key: "p", label: "p", f: (p) => p },
  { key: "np", label: "~p", f: (p) => !p, note: "นิเสธ" },
  { key: "and", label: "p ∧ q", f: (p, q) => p && q, note: "และ" },
  { key: "or", label: "p ∨ q", f: (p, q) => p || q, note: "หรือ" },
  { key: "imp", label: "p → q", f: (p, q) => !p || q, note: "ถ้า...แล้ว" },
  { key: "conv", label: "q → p", f: (p, q) => !q || p, note: "บทกลับ" },
  { key: "inv", label: "~p → ~q", f: (p, q) => p || !q, note: "บทแย้งสลับที่" },
  { key: "contra", label: "~q → ~p", f: (p, q) => q || !p, note: "แย้งสลับที่ (contrapositive)" },
  { key: "iff", label: "p ↔ q", f: (p, q) => p === q, note: "ก็ต่อเมื่อ" },
  { key: "nand", label: "~(p ∧ q)", f: (p, q) => !(p && q) },
  { key: "ornn", label: "~p ∨ ~q", f: (p, q) => !p || !q },
  { key: "nor", label: "~(p ∨ q)", f: (p, q) => !(p || q) },
  { key: "andnn", label: "~p ∧ ~q", f: (p, q) => !p && !q },
  { key: "orimp", label: "~p ∨ q", f: (p, q) => !p || q },
];

const ROWS: Array<[boolean, boolean]> = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
];

function Cell({ v }: { v: boolean }) {
  return (
    <span
      className={cx(
        "inline-block w-6 rounded text-center font-mono text-[12.5px] font-medium",
        v ? "text-ok" : "text-danger",
      )}
    >
      {v ? "T" : "F"}
    </span>
  );
}

/**
 * ตารางค่าความจริง — เลือกสองนิพจน์แล้วเทียบคอลัมน์
 * ถ้าคอลัมน์เหมือนกันทั้งสี่แถว แปลว่าสมมูลกัน ซึ่งเป็นทักษะหลักของบทตรรกศาสตร์
 */
export function InteractiveTruthTable() {
  const [aKey, setAKey] = useState("imp");
  const [bKey, setBKey] = useState("contra");

  const A = FORMULAS.find((f) => f.key === aKey) ?? FORMULAS[0]!;
  const B = FORMULAS.find((f) => f.key === bKey) ?? FORMULAS[1]!;

  const { colA, colB, same, allTrueA, allFalseA } = useMemo(() => {
    const ca = ROWS.map(([p, q]) => A.f(p, q));
    const cb = ROWS.map(([p, q]) => B.f(p, q));
    return {
      colA: ca,
      colB: cb,
      same: ca.every((v, i) => v === cb[i]),
      allTrueA: ca.every(Boolean),
      allFalseA: ca.every((v) => !v),
    };
  }, [A, B]);

  const picker = (value: string, onChange: (v: string) => void, label: string) => (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 font-mono text-[13px] text-ink"
      >
        {FORMULAS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
            {f.note ? `  (${f.note})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <VizFrame
      title="ตารางค่าความจริง — เทียบสองนิพจน์"
      caption="เลือกนิพจน์สองอัน ถ้าคอลัมน์ผลลัพธ์เหมือนกันครบทั้งสี่แถว แปลว่าสองนิพจน์นั้นสมมูลกัน"
      canvas={
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse text-[14px]">
            <thead>
              <tr>
                {["p", "q", A.label, B.label].map((h, i) => (
                  <th
                    key={i}
                    className={cx(
                      "border-b border-line-strong bg-surface-2 px-3 py-2.5 text-center font-mono text-[12.5px] whitespace-nowrap",
                      i >= 2 ? "text-accent-ink" : "text-ink-3",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([p, q], i) => (
                <tr key={i} className={cx(colA[i] !== colB[i] && "bg-danger-soft")}>
                  <td className="border-b border-line px-3 py-2 text-center">
                    <Cell v={p} />
                  </td>
                  <td className="border-b border-line px-3 py-2 text-center">
                    <Cell v={q} />
                  </td>
                  <td className="border-b border-line px-3 py-2 text-center">
                    <Cell v={colA[i]!} />
                  </td>
                  <td className="border-b border-line px-3 py-2 text-center">
                    <Cell v={colB[i]!} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      controls={
        <div className="flex flex-col gap-3">
          {picker(aKey, setAKey, "นิพจน์ที่ 1")}
          {picker(bKey, setBKey, "นิพจน์ที่ 2")}
        </div>
      }
      readout={
        <div className="border-t border-line pt-3">
          <p
            className={cx(
              "m-0 font-display text-[14.5px] font-semibold",
              same ? "text-ok" : "text-danger",
            )}
          >
            {same ? "สมมูลกัน ✓" : "ไม่สมมูลกัน"}
          </p>
          <p className="m-0 mt-1 text-[13px] leading-snug text-ink-3">
            {same
              ? "ทุกแถวให้ค่าความจริงตรงกัน จึงใช้แทนกันได้ในทุกกรณี"
              : "มีแถวที่ให้ค่าต่างกัน (แถบสีแดง) จึงใช้แทนกันไม่ได้"}
          </p>
          <p className="m-0 mt-3 font-mono text-[12px] text-ink-3">
            นิพจน์ที่ 1 เป็น{" "}
            <span className="text-ink">
              {allTrueA ? "สัจนิรันดร์ (จริงทุกกรณี)" : allFalseA ? "ข้อขัดแย้ง (เท็จทุกกรณี)" : "ประพจน์ทั่วไป"}
            </span>
          </p>
        </div>
      }
    />
  );
}
