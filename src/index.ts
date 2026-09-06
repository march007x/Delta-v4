import { lessonSchema, type Lesson } from "./schema";
import { setBasic } from "./lessons/set-basic";
import { logicBasic } from "./lessons/logic-basic";
import { realNumberLine } from "./lessons/real-number-line";
import { polynomial } from "./lessons/polynomial";
import { equationInequality } from "./lessons/equation-inequality";
import { functionBasic } from "./lessons/function-basic";
import { quadraticFunction } from "./lessons/quadratic-function";
import { exponential } from "./lessons/exponential";
import { logarithm } from "./lessons/logarithm";
import { analyticGeometry } from "./lessons/analytic-geometry";
import { sequenceSeries } from "./lessons/sequence-series";
import { counting } from "./lessons/counting";
import { probability } from "./lessons/probability";
import { unitCircle } from "./lessons/unit-circle";
import { trigIdentity } from "./lessons/trig-identity";
import { trigLaw } from "./lessons/trig-law";
import { matrix } from "./lessons/matrix";
import { vector } from "./lessons/vector";
import { complexNumber } from "./lessons/complex-number";
import { statistics } from "./lessons/statistics";
import { limitContinuity } from "./lessons/limit-continuity";
import { derivativeIntro } from "./lessons/derivative-intro";
import { derivativeApplication } from "./lessons/derivative-application";
import { integral } from "./lessons/integral";

export { courses, chapters, topics } from "./structure";

/** เรียงตามลำดับที่ควรเรียน — ใช้ทำ "บทก่อนหน้า / บทถัดไป" ด้วย */
const RAW: Lesson[] = [
  // ม.4
  setBasic,
  logicBasic,
  realNumberLine,
  polynomial,
  equationInequality,
  functionBasic,
  quadraticFunction,
  exponential,
  logarithm,
  analyticGeometry,
  sequenceSeries,
  counting,
  probability,
  // ม.5
  unitCircle,
  trigIdentity,
  trigLaw,
  vector,
  complexNumber,
  matrix,
  statistics,
  // ม.6
  limitContinuity,
  derivativeIntro,
  derivativeApplication,
  integral,
];

/**
 * ตรวจรูปแบบเนื้อหาตอน build — เนื้อหาที่ผิดโครงสร้างจะทำให้ build ล้ม
 * ดีกว่าปล่อยให้ผู้เรียนเจอหน้าพัง
 */
export const lessons: Lesson[] = RAW.map((l) => lessonSchema.parse(l));
