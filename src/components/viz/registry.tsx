"use client";

import { InteractiveQuadratic } from "./InteractiveQuadratic";
import { InteractiveGraph, type GraphFamily } from "./InteractiveGraph";
import { InteractiveDerivative } from "./InteractiveDerivative";
import { InteractiveUnitCircle } from "./InteractiveUnitCircle";
import { InteractiveVenn } from "./InteractiveVenn";
import { InteractiveNumberLine } from "./InteractiveNumberLine";
import { InteractiveTruthTable } from "./InteractiveTruthTable";
import { InteractiveAnalyticGeometry } from "./InteractiveAnalyticGeometry";
import { InteractiveSequence } from "./InteractiveSequence";
import { InteractiveProbability } from "./InteractiveProbability";
import { InteractiveVector } from "./InteractiveVector";
import { InteractiveComplexPlane } from "./InteractiveComplexPlane";
import { InteractiveStatistics } from "./InteractiveStatistics";
import { InteractiveLimit } from "./InteractiveLimit";
import { InteractiveIntegral } from "./InteractiveIntegral";
import { InteractiveExtrema } from "./InteractiveExtrema";
import { InteractiveMatrix } from "./InteractiveMatrix";
import { InteractiveTriangle } from "./InteractiveTriangle";

/**
 * ทะเบียนภาพประกอบ — บทเรียนอ้างถึงภาพด้วย "componentKey" ที่เก็บอยู่ในข้อมูล
 * ไม่ใช่ด้วยการ import component ตรง ๆ จึงย้ายไปเก็บในฐานข้อมูลภายหลังได้โดยไม่แก้โค้ด
 */
export const VIZ_KEYS = [
  "quadratic",
  "graph.linear",
  "graph.vertexForm",
  "graph.absolute",
  "graph.reciprocal",
  "graph.exponential",
  "graph.logarithm",
  "graph.cubicRoots",
  "graph.sine",
  "derivative",
  "unitCircle",
  "venn",
  "numberLine",
  "truthTable",
  "analyticGeometry",
  "sequence",
  "probability",
  "vector",
  "complexPlane",
  "statistics",
  "limit",
  "integral",
  "extrema",
  "matrix",
  "triangle",
] as const;

export type VizKey = (typeof VIZ_KEYS)[number];

export function VizByKey({
  componentKey,
  config,
}: {
  componentKey: string;
  config?: Record<string, unknown>;
}) {
  const height = typeof config?.height === "number" ? config.height : undefined;
  const initial = (config?.initial as Record<string, number> | undefined) ?? undefined;
  const title = typeof config?.title === "string" ? config.title : undefined;
  const caption = typeof config?.caption === "string" ? config.caption : undefined;

  if (componentKey === "quadratic") return <InteractiveQuadratic height={height} />;
  if (componentKey === "derivative") return <InteractiveDerivative height={height} />;
  if (componentKey === "unitCircle") return <InteractiveUnitCircle height={height} />;
  if (componentKey === "venn") return <InteractiveVenn height={height} />;
  if (componentKey === "numberLine") return <InteractiveNumberLine height={height} />;
  if (componentKey === "truthTable") return <InteractiveTruthTable />;
  if (componentKey === "analyticGeometry") return <InteractiveAnalyticGeometry height={height} />;
  if (componentKey === "sequence") return <InteractiveSequence height={height} />;
  if (componentKey === "probability") return <InteractiveProbability height={height} />;
  if (componentKey === "vector") return <InteractiveVector height={height} />;
  if (componentKey === "complexPlane") return <InteractiveComplexPlane height={height} />;
  if (componentKey === "statistics") return <InteractiveStatistics height={height} />;
  if (componentKey === "limit") return <InteractiveLimit height={height} />;
  if (componentKey === "integral") return <InteractiveIntegral height={height} />;
  if (componentKey === "extrema") return <InteractiveExtrema height={height} />;
  if (componentKey === "matrix") return <InteractiveMatrix height={height} />;
  if (componentKey === "triangle") return <InteractiveTriangle height={height} />;

  if (componentKey.startsWith("graph.")) {
    const family = componentKey.slice("graph.".length) as GraphFamily;
    return (
      <InteractiveGraph
        family={family}
        height={height}
        initial={initial}
        title={title}
        caption={caption}
      />
    );
  }

  return (
    <p className="my-4 rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-3 text-[14px] text-ink-3">
      ยังไม่มีภาพประกอบสำหรับ <code className="font-mono">{componentKey}</code> — จะเพิ่มใน Phase ถัดไป
    </p>
  );
}
