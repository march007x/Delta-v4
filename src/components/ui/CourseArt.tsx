/**
 * ภาพประกอบการ์ดบทเรียน — วาดรูปคณิตศาสตร์จริงด้วยโค้ด
 *
 * เลือกใช้ "รูปที่ตรงกับเนื้อหา" ไม่ใช่ลายนามธรรมสวย ๆ เพราะการ์ดหนึ่งใบ
 * ต้องบอกได้ตั้งแต่ยังไม่อ่านชื่อว่านี่คือเรื่องอะไร — วงกลมหนึ่งหน่วยคือตรีโกณ
 * พาราโบลาคือฟังก์ชันกำลังสอง ระฆังคว่ำคือสถิติ ผู้เรียนจึงกวาดตาหาบทที่ต้องการได้เร็ว
 *
 * วาดด้วย SVG ไม่ใช่ไฟล์ภาพ: การ์ดหนึ่งใบหนักราว 2 KB แทนที่จะเป็นหลักร้อย KB
 * คมทุกความละเอียดจอ และบทเรียนใหม่ได้ภาพของตัวเองทันทีโดยไม่ต้องรอใครวาด
 */

export type Motif =
  | "unitCircle"
  | "wave"
  | "parabola"
  | "bell"
  | "vector"
  | "asymptote"
  | "integral"
  | "network"
  | "matrix"
  | "steps"
  | "venn"
  | "truth"
  | "numberline"
  | "dice"
  | "series"
  | "line";

/** จับคู่บทเรียนกับรูปจากคำในชื่อ — บทใหม่ที่ยังไม่ได้จับคู่จะได้ลายเครือข่ายเป็นค่าตั้งต้น */
const RULES: Array<[RegExp, Motif]> = [
  [/เซต|set/i, "venn"],
  [/ตรรกศาสตร์|ประพจน์|logic/i, "truth"],
  [/จำนวนจริง|เส้นจำนวน|อสมการ|สมการ|real-number|inequality/i, "numberline"],
  [/พหุนาม|แยกตัวประกอบ|polynomial/i, "line"],
  [/กำลังสอง|พาราโบลา|quadratic/i, "parabola"],
  [/ฟังก์ชัน|function/i, "line"],
  [/เรขาคณิตวิเคราะห์|analytic/i, "line"],
  [/เลขยกกำลัง|เอกซ์โพเนนเชียล|ลอการิทึม|exponential|logarithm/i, "series"],
  [/ลำดับ|อนุกรม|sequence|series/i, "series"],
  [/หลักการนับ|เรียงสับเปลี่ยน|counting|permutation/i, "network"],
  [/ความน่าจะเป็น|probability/i, "dice"],
  [/สถิติ|ค่ากลาง|การกระจาย|statistic/i, "bell"],
  [/เอกลักษณ์ตรีโกณ|กฎไซน์|กฎโคไซน์|trig-law|trig-identity/i, "wave"],
  [/ตรีโกณ|วงกลมหนึ่งหน่วย|unit-circle|trig/i, "unitCircle"],
  [/เวกเตอร์|vector/i, "vector"],
  [/จำนวนเชิงซ้อน|complex/i, "matrix"],
  [/เมทริกซ์|matrix/i, "matrix"],
  [/ลิมิต|ความต่อเนื่อง|เส้นกำกับ|limit/i, "asymptote"],
  [/ปริพันธ์|อินทิเกรต|integral|พื้นที่ใต้/i, "integral"],
  [/อนุพันธ์|derivative/i, "steps"],
];

export function motifFor(text: string): Motif {
  for (const [re, m] of RULES) if (re.test(text)) return m;
  return "network";
}

const W = 320;
const H = 150;

/** ระบบพิกัดของรูป: x ซ้าย→ขวา, y ล่าง→บน เหมือนกราฟในหนังสือ ไม่ใช่ทิศของ SVG */
const px = (x: number) => 24 + ((x + 4) / 8) * (W - 48);
const py = (y: number) => H - 22 - ((y + 2.6) / 5.2) * (H - 44);

function curve(
  f: (x: number) => number,
  from = -4,
  to = 4,
  steps = 90,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = from + ((to - from) * i) / steps;
    const y = f(x);
    if (!Number.isFinite(y) || y > 4.2 || y < -3.4) {
      pts.push("");
      continue;
    }
    pts.push(
      `${pts.length && pts[pts.length - 1] !== "" ? "L" : "M"}${px(x).toFixed(1)} ${py(y).toFixed(1)}`,
    );
  }
  return pts.filter(Boolean).join(" ");
}

function Grid() {
  const v = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <g stroke="var(--art-grid)" strokeWidth="0.6">
      {v.map((x) => (
        <line
          key={`v${x}`}
          x1={px(x)}
          y1={py(-2.4)}
          x2={px(x)}
          y2={py(4)}
          opacity={x === 0 ? 0 : 0.5}
        />
      ))}
      {[-2, -1, 0, 1, 2, 3].map((y) => (
        <line
          key={`h${y}`}
          x1={px(-3.6)}
          y1={py(y)}
          x2={px(3.6)}
          y2={py(y)}
          opacity={y === 0 ? 0 : 0.5}
        />
      ))}
      <g stroke="var(--art-axis)" strokeWidth="1">
        <line x1={px(-3.7)} y1={py(0)} x2={px(3.7)} y2={py(0)} />
        <line x1={px(0)} y1={py(-2.5)} x2={px(0)} y2={py(4.1)} />
      </g>
    </g>
  );
}

export function CourseArt({
  seedText,
  motif,
  className,
  height = 150,
}: {
  seedText: string;
  motif?: Motif;
  className?: string;
  height?: number;
}) {
  const kind = motif ?? motifFor(seedText);
  const id = `ca${Math.abs(hash(seedText)).toString(36)}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ display: "block", width: "100%", height }}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="var(--art-bg-1)" />
          <stop offset="100%" stopColor="var(--art-bg-2)" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0%" stopColor="var(--art-glow)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--art-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}b)`} />
      <rect width={W} height={H} fill={`url(#${id}g)`} />
      <Figure kind={kind} seed={hash(seedText)} />
    </svg>
  );
}

function hash(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

function Figure({ kind, seed }: { kind: Motif; seed: number }) {
  const stroke = {
    fill: "none",
    stroke: "var(--art-line)",
    strokeWidth: 1.5,
  } as const;

  if (kind === "unitCircle") {
    const cx = px(0);
    const cy = py(0.4);
    const r = 44;
    const a = (Math.PI / 180) * 52;
    return (
      <>
        <Grid />
        <circle cx={cx} cy={cy} r={r} {...stroke} />
        <line
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(a)}
          y2={cy - r * Math.sin(a)}
          stroke="var(--art-hi)"
          strokeWidth="1.8"
        />
        <line
          x1={cx + r * Math.cos(a)}
          y1={cy - r * Math.sin(a)}
          x2={cx + r * Math.cos(a)}
          y2={cy}
          stroke="var(--art-hi)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <path
          d={`M${cx + 15} ${cy} A 15 15 0 0 0 ${cx + 15 * Math.cos(a)} ${cy - 15 * Math.sin(a)}`}
          {...stroke}
          strokeWidth="1.1"
        />
        <circle
          cx={cx + r * Math.cos(a)}
          cy={cy - r * Math.sin(a)}
          r="3.2"
          fill="var(--art-core)"
        />
      </>
    );
  }

  if (kind === "wave") {
    return (
      <>
        <Grid />
        <path d={curve((x) => 2 * Math.sin(x * 1.15))} {...stroke} />
        <path
          d={curve((x) => 1.35 * Math.cos(x * 1.7))}
          {...stroke}
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path
          d={curve((x) => 0.8 * Math.sin(x * 2.6 + 1))}
          {...stroke}
          strokeWidth="1"
          opacity="0.3"
        />
      </>
    );
  }

  if (kind === "parabola") {
    return (
      <>
        <Grid />
        <path d={curve((x) => 0.55 * x * x - 1.6)} {...stroke} />
        <line
          x1={px(0)}
          y1={py(-2.4)}
          x2={px(0)}
          y2={py(4)}
          stroke="var(--art-hi)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <circle cx={px(0)} cy={py(-1.6)} r="3.4" fill="var(--art-core)" />
        <circle cx={px(-1.706)} cy={py(0)} r="2.4" fill="var(--art-hi)" />
        <circle cx={px(1.706)} cy={py(0)} r="2.4" fill="var(--art-hi)" />
      </>
    );
  }

  if (kind === "bell") {
    const f = (x: number) => 3.1 * Math.exp(-(x * x) / 1.6) - 2;
    const bars = [-2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8, 2.4];
    return (
      <>
        <Grid />
        <g fill="var(--art-fill)">
          {bars.map((x, i) => {
            const top = py(f(x));
            return (
              <rect
                key={i}
                x={px(x) - 8}
                y={top}
                width="16"
                height={py(-2) - top}
                opacity="0.5"
              />
            );
          })}
        </g>
        <path d={curve(f, -3.2, 3.2)} {...stroke} strokeWidth="1.8" />
      </>
    );
  }

  if (kind === "vector") {
    const vs: Array<[number, number]> = [
      [2.6, 1.9],
      [-1.9, 2.4],
      [1.4, -1.6],
    ];
    return (
      <>
        <Grid />
        {vs.map(([x, y], i) => (
          <g key={i}>
            <line
              x1={px(0)}
              y1={py(0)}
              x2={px(x)}
              y2={py(y)}
              stroke={i === 0 ? "var(--art-hi)" : "var(--art-line)"}
              strokeWidth={i === 0 ? 2 : 1.3}
              opacity={i === 0 ? 1 : 0.6}
            />
            <circle
              cx={px(x)}
              cy={py(y)}
              r={i === 0 ? 3.4 : 2.4}
              fill={i === 0 ? "var(--art-core)" : "var(--art-line)"}
            />
          </g>
        ))}
        <path
          d={`M${px(2.6)} ${py(1.9)} L${px(0.7)} ${py(4.3)}`}
          stroke="var(--art-line)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.45"
          fill="none"
        />
      </>
    );
  }

  if (kind === "asymptote") {
    return (
      <>
        <Grid />
        <line
          x1={px(1)}
          y1={py(-2.4)}
          x2={px(1)}
          y2={py(4)}
          stroke="var(--art-hi)"
          strokeWidth="1.2"
          strokeDasharray="5 4"
        />
        <line
          x1={px(-3.7)}
          y1={py(1)}
          x2={px(3.7)}
          y2={py(1)}
          stroke="var(--art-hi)"
          strokeWidth="1.2"
          strokeDasharray="5 4"
          opacity="0.7"
        />
        <path d={curve((x) => 1 + 1.6 / (x - 1), -3.6, 0.72)} {...stroke} />
        <path d={curve((x) => 1 + 1.6 / (x - 1), 1.3, 3.6)} {...stroke} />
      </>
    );
  }

  if (kind === "integral") {
    const f = (x: number) => 3.2 - 0.42 * x * x;
    const seg: string[] = [];
    for (let x = -2; x <= 2.0001; x += 0.5) {
      const top = py(f(x));
      seg.push(
        `M${px(x) - 15} ${py(0)} L${px(x) - 15} ${top} L${px(x) + 15} ${top} L${px(x) + 15} ${py(0)}`,
      );
    }
    return (
      <>
        <Grid />
        <g
          fill="var(--art-fill)"
          stroke="var(--art-line)"
          strokeWidth="0.7"
          opacity="0.75"
        >
          {seg.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={curve(f, -2.9, 2.9)} {...stroke} strokeWidth="1.8" />
      </>
    );
  }

  if (kind === "steps") {
    const f = (x: number) => 0.16 * x * x * x - 0.6 * x + 0.4;
    return (
      <>
        <Grid />
        <path d={curve(f, -3.4, 3.4)} {...stroke} strokeWidth="1.8" />
        {[-1.1, 1.1].map((x, i) => (
          <g key={i}>
            <line
              x1={px(x - 1.2)}
              y1={py(f(x))}
              x2={px(x + 1.2)}
              y2={py(f(x))}
              stroke="var(--art-hi)"
              strokeWidth="1.4"
            />
            <circle cx={px(x)} cy={py(f(x))} r="3.2" fill="var(--art-core)" />
          </g>
        ))}
      </>
    );
  }

  if (kind === "matrix") {
    const cells = [0, 1, 2, 3].map((i) => [i % 2, Math.floor(i / 2)] as const);
    return (
      <>
        <g stroke="var(--art-line)" fill="none" strokeWidth="1.4">
          {cells.map(([c, r], i) => (
            <rect
              key={i}
              x={W / 2 - 46 + c * 46}
              y={H / 2 - 40 + r * 40}
              width="38"
              height="32"
              rx="3"
              opacity={0.45 + i * 0.15}
            />
          ))}
          <path
            d={`M${W / 2 - 60} ${H / 2 - 46} l-8 0 0 84 8 0`}
            strokeWidth="1.8"
          />
          <path
            d={`M${W / 2 + 60} ${H / 2 - 46} l8 0 0 84 -8 0`}
            strokeWidth="1.8"
          />
        </g>
        <circle
          cx={W / 2 + 12}
          cy={H / 2 - 24}
          r="3.4"
          fill="var(--art-core)"
        />
      </>
    );
  }

  if (kind === "venn") {
    const cy = py(0.5);
    return (
      <>
        <circle
          cx={px(-0.85)}
          cy={cy}
          r="42"
          fill="var(--art-fill)"
          stroke="var(--art-line)"
          strokeWidth="1.5"
        />
        <circle
          cx={px(0.85)}
          cy={cy}
          r="42"
          fill="var(--art-fill)"
          stroke="var(--art-line)"
          strokeWidth="1.5"
        />
        <rect
          x={px(-3.4)}
          y={py(2.7)}
          width={px(3.4) - px(-3.4)}
          height={py(-1.7) - py(2.7)}
          fill="none"
          stroke="var(--art-line)"
          strokeWidth="1"
          opacity="0.4"
          rx="4"
        />
        <circle cx={px(0)} cy={cy} r="3.2" fill="var(--art-core)" />
      </>
    );
  }

  if (kind === "truth") {
    const rows = [1, 1, 0, 0];
    const cols = [1, 0, 1, 0];
    return (
      <g fontFamily="var(--font-mono)" fontSize="11">
        <g stroke="var(--art-line)" strokeWidth="1" opacity="0.5" fill="none">
          <line x1={px(-2.6)} y1={py(1.9)} x2={px(2.6)} y2={py(1.9)} />
          <line x1={px(0.35)} y1={py(2.5)} x2={px(0.35)} y2={py(-1.9)} />
        </g>
        {rows.map((_, i) => (
          <g key={i} fill="var(--art-line)">
            <text x={px(-1.9)} y={py(1.2 - i * 0.85)} textAnchor="middle">
              {rows[i] ? "T" : "F"}
            </text>
            <text x={px(-0.6)} y={py(1.2 - i * 0.85)} textAnchor="middle">
              {cols[i] ? "T" : "F"}
            </text>
            <text
              x={px(1.4)}
              y={py(1.2 - i * 0.85)}
              textAnchor="middle"
              fill={rows[i] && cols[i] ? "var(--art-core)" : "var(--art-line)"}
              opacity={rows[i] && cols[i] ? 1 : 0.45}
            >
              {rows[i] && cols[i] ? "T" : "F"}
            </text>
          </g>
        ))}
      </g>
    );
  }

  if (kind === "numberline") {
    const y = py(0.4);
    return (
      <>
        <line
          x1={px(-3.5)}
          y1={y}
          x2={px(3.5)}
          y2={y}
          stroke="var(--art-axis)"
          strokeWidth="1.4"
        />
        {[-3, -2, -1, 0, 1, 2, 3].map((t) => (
          <line
            key={t}
            x1={px(t)}
            y1={y - 6}
            x2={px(t)}
            y2={y + 6}
            stroke="var(--art-line)"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
        <line
          x1={px(-1)}
          y1={y}
          x2={px(2)}
          y2={y}
          stroke="var(--art-hi)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx={px(-1)}
          cy={y}
          r="4.5"
          fill="var(--art-bg-2)"
          stroke="var(--art-core)"
          strokeWidth="2"
        />
        <circle cx={px(2)} cy={y} r="4.5" fill="var(--art-core)" />
      </>
    );
  }

  if (kind === "dice") {
    const pipsFor = (n: number) =>
      ({
        1: [[1, 1]],
        3: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
        5: [
          [0, 0],
          [2, 0],
          [1, 1],
          [0, 2],
          [2, 2],
        ],
      })[n] ?? [];
    return (
      <g>
        {[
          { x: W * 0.3, y: H * 0.42, s: 52, n: 5, rot: -12 },
          { x: W * 0.62, y: H * 0.56, s: 44, n: 3, rot: 9 },
        ].map((d, i) => (
          <g key={i} transform={`rotate(${d.rot} ${d.x} ${d.y})`}>
            <rect
              x={d.x - d.s / 2}
              y={d.y - d.s / 2}
              width={d.s}
              height={d.s}
              rx="9"
              fill="var(--art-fill)"
              stroke="var(--art-line)"
              strokeWidth="1.6"
            />
            {pipsFor(d.n).map((pip, k) => (
              <circle
                key={k}
                cx={d.x - d.s / 2 + (d.s / 4) * (1 + (pip[0] ?? 0))}
                cy={d.y - d.s / 2 + (d.s / 4) * (1 + (pip[1] ?? 0))}
                r={d.s / 14}
                fill="var(--art-core)"
              />
            ))}
          </g>
        ))}
      </g>
    );
  }

  if (kind === "series") {
    const bars = [0.35, 0.55, 0.85, 1.3, 1.95, 2.9];
    return (
      <>
        <Grid />
        <g>
          {bars.map((v, i) => {
            const x = px(-2.6 + i * 1.05);
            const top = py(v);
            return (
              <rect
                key={i}
                x={x - 11}
                y={top}
                width="22"
                height={py(0) - top}
                rx="2"
                fill="var(--art-fill)"
                stroke="var(--art-line)"
                strokeWidth="1.1"
              />
            );
          })}
        </g>
        <path
          d={curve((x) => 0.42 * Math.exp(0.62 * x), -2.9, 2.1)}
          {...stroke}
          strokeWidth="1.8"
        />
      </>
    );
  }

  if (kind === "line") {
    return (
      <>
        <Grid />
        <path d={curve((x) => 0.85 * x + 0.4)} {...stroke} strokeWidth="1.8" />
        <path
          d={curve((x) => -0.45 * x + 1.6)}
          {...stroke}
          strokeWidth="1.3"
          opacity="0.5"
        />
        <circle cx={px(0.923)} cy={py(1.185)} r="3.6" fill="var(--art-core)" />
      </>
    );
  }

  // network — หลักการนับ: จุดที่เชื่อมโยงกันเป็นโครงข่าย
  const r = rngOf(seed);
  const pts = Array.from({ length: 11 }, () => ({
    x: 30 + r() * (W - 60),
    y: 24 + r() * (H - 48),
  }));
  const links: Array<[number, number]> = [];
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y) < 78)
        links.push([i, j]);
  return (
    <>
      <g stroke="var(--art-line)" strokeWidth="0.9" opacity="0.5">
        {links.map(([i, j], k) => (
          <line
            key={k}
            x1={pts[i]!.x}
            y1={pts[i]!.y}
            x2={pts[j]!.x}
            y2={pts[j]!.y}
          />
        ))}
      </g>
      <g fill="var(--art-line)">
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i % 4 === 0 ? 3.6 : 2.2}
            fill={i % 4 === 0 ? "var(--art-core)" : "var(--art-line)"}
          />
        ))}
      </g>
    </>
  );
}

/** ตัวสุ่มที่กำหนดผลได้ — ต้องได้ผลเดิมทุกครั้ง ไม่งั้นเซิร์ฟเวอร์กับเบราว์เซอร์วาดคนละแบบ */
function rngOf(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
