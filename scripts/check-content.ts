/**
 * ตรวจความถูกต้องเชิงโครงสร้างของเนื้อหาทั้งหมด
 *
 * รันด้วย:  npm run check
 *
 * สคริปต์นี้ตรวจสิ่งที่เครื่องตรวจแทนคนได้ เช่น ควิซที่ลืมกำหนดคำตอบถูก
 * หรือบทเรียนที่อ้างถึงกราฟที่ยังไม่มีอยู่จริง
 * แต่ **ตรวจความถูกต้องทางคณิตศาสตร์ของเนื้อหาไม่ได้** — ส่วนนั้นยังต้องให้คนอ่าน
 */
import { lessons, topics, chapters, courses } from "../src/content";
import { SECTION_TYPES } from "../src/content/schema";
import { VIZ_KEYS } from "../src/components/viz/registry";

let errors = 0;
let warnings = 0;

const err = (msg: string) => {
  console.log(`  ✗ ${msg}`);
  errors++;
};
const warn = (msg: string) => {
  console.log(`  ! ${msg}`);
  warnings++;
};

console.log("\n=== ตรวจโครงสร้างเนื้อหา ===\n");

// 1. ไม่มี id หรือ slug ซ้ำ
const seenIds = new Set<string>();
const seenSlugs = new Set<string>();
for (const l of lessons) {
  if (seenIds.has(l.id)) err(`บทเรียน id ซ้ำ: ${l.id}`);
  if (seenSlugs.has(l.slug)) err(`บทเรียน slug ซ้ำ: ${l.slug}`);
  seenIds.add(l.id);
  seenSlugs.add(l.slug);
}

// 2. topicId ที่อ้างถึงต้องมีอยู่จริง และ chapterId ของหัวข้อก็ต้องมีอยู่จริง
const topicIds = new Set(topics.map((t) => t.id));
const chapterIds = new Set(chapters.map((c) => c.id));
const courseIds = new Set(courses.map((c) => c.id));
for (const l of lessons) {
  if (!topicIds.has(l.topicId)) err(`บทเรียน ${l.slug} อ้างถึงหัวข้อที่ไม่มีอยู่: ${l.topicId}`);
}
for (const t of topics) {
  if (!chapterIds.has(t.chapterId)) err(`หัวข้อ ${t.slug} อ้างถึงบทที่ไม่มีอยู่: ${t.chapterId}`);
  for (const p of t.prerequisites) {
    if (!topicIds.has(p)) err(`หัวข้อ ${t.slug} อ้างถึงพื้นฐานที่ไม่มีอยู่: ${p}`);
  }
}
for (const c of chapters) {
  if (!courseIds.has(c.courseId)) err(`บท ${c.title} อ้างถึงหลักสูตรที่ไม่มีอยู่: ${c.courseId}`);
}

// 3. กราฟลำดับพื้นฐานต้องไม่มีวงจร
const visiting = new Set<string>();
const done = new Set<string>();
function hasCycle(id: string, path: string[]): boolean {
  if (visiting.has(id)) {
    err(`พบวงจรในลำดับพื้นฐาน: ${[...path, id].join(" → ")}`);
    return true;
  }
  if (done.has(id)) return false;
  visiting.add(id);
  const t = topics.find((x) => x.id === id);
  for (const p of t?.prerequisites ?? []) {
    if (hasCycle(p, [...path, id])) return true;
  }
  visiting.delete(id);
  done.add(id);
  return false;
}
for (const t of topics) hasCycle(t.id, []);

// 4. ทุกบทเรียนต้องมีขั้นการสอนครบและเรียงถูก
for (const l of lessons) {
  const types = l.sections.map((s) => s.type);
  const missing = SECTION_TYPES.filter((t) => !types.includes(t));
  if (missing.length > 0) warn(`${l.slug}: ขาดขั้น ${missing.join(", ")}`);

  const order = types.map((t) => SECTION_TYPES.indexOf(t));
  for (let i = 1; i < order.length; i++) {
    if (order[i]! < order[i - 1]!) {
      warn(`${l.slug}: ลำดับขั้นสลับที่ (${types[i - 1]} มาก่อน ${types[i]})`);
      break;
    }
  }

  const ids = new Set<string>();
  for (const s of l.sections) {
    if (ids.has(s.id)) err(`${l.slug}: section id ซ้ำ (${s.id})`);
    ids.add(s.id);
  }
}

// 5. ควิซต้องมีคำตอบถูกหนึ่งข้อพอดี และมีคำอธิบาย
let quizCount = 0;
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind === "numeric") {
        quizCount++;
        if (!Number.isFinite(b.answer)) err(`${l.slug}/${s.id}: ข้อกรอกตัวเลขไม่มีคำตอบที่เป็นตัวเลข`);
        // คำตอบที่ไม่ลงตัวต้องบอกความคลาดเคลื่อนที่ยอมรับ ไม่งั้นคนปัดทศนิยมจะถูกตัดสินว่าผิด
        const tidy = Math.abs(b.answer * 1000 - Math.round(b.answer * 1000)) < 1e-9;
        if (!tidy && b.tolerance === undefined) {
          warn(`${l.slug}/${s.id}: คำตอบ ${b.answer} ไม่ลงตัว ควรกำหนด tolerance`);
        }
        if (b.hints.length < 2) {
          warn(`${l.slug}/${s.id}: ข้อกรอกตัวเลขควรมีแนวทางอย่างน้อย 2 ขั้น (มี ${b.hints.length})`);
        }
        continue;
      }
      if (b.kind !== "quiz") continue;
      quizCount++;
      const correct = b.choices.filter((c) => c.correct).length;
      if (correct !== 1) {
        err(`${l.slug}/${s.id}: ควิซมีคำตอบถูก ${correct} ข้อ (ต้องมี 1 ข้อพอดี) — "${b.prompt.slice(0, 40)}…"`);
      }
      if (b.choices.length < 2) err(`${l.slug}/${s.id}: ควิซมีตัวเลือกน้อยกว่า 2 ข้อ`);
      if (!b.explain || b.explain.length < 20) {
        warn(`${l.slug}/${s.id}: คำอธิบายเฉลยสั้นเกินไป`);
      }
      const texts = b.choices.map((c) => c.text);
      if (new Set(texts).size !== texts.length) {
        err(`${l.slug}/${s.id}: ควิซมีตัวเลือกซ้ำกัน`);
      }
    }
  }
}

// 6. componentKey ของกราฟต้องมีอยู่ในทะเบียนจริง
const vizKeys = new Set<string>(VIZ_KEYS);
let vizCount = 0;
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "viz") continue;
      vizCount++;
      if (!vizKeys.has(b.componentKey)) {
        err(`${l.slug}/${s.id}: อ้างถึงกราฟที่ไม่มีในทะเบียน (${b.componentKey})`);
      }
    }
  }
}

// 7. ตารางต้องมีจำนวนคอลัมน์ตรงกับหัวตารางทุกแถว
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      if (b.kind !== "table") continue;
      b.rows.forEach((r, i) => {
        if (r.length !== b.headers.length) {
          err(
            `${l.slug}/${s.id}: ตารางแถวที่ ${i + 1} มี ${r.length} ช่อง แต่หัวตารางมี ${b.headers.length} ช่อง`,
          );
        }
      });
    }
  }
}

// 8. เครื่องหมาย $ ต้องเป็นคู่ มิฉะนั้นสูตรจะเรนเดอร์ผิด
function checkDollars(text: string, where: string) {
  const count = (text.match(/\$/g) ?? []).length;
  if (count % 2 !== 0) err(`${where}: เครื่องหมาย $ ไม่เป็นคู่ — "${text.slice(0, 50)}…"`);
}
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      const where = `${l.slug}/${s.id}`;
      if (b.kind === "paragraph") checkDollars(b.text, where);
      if (b.kind === "callout") checkDollars(b.text ?? "", where);
      if (b.kind === "list") b.items.forEach((i) => checkDollars(i, where));
      if (b.kind === "quiz") {
        checkDollars(b.prompt, where);
        checkDollars(b.explain, where);
        b.choices.forEach((c) => checkDollars(c.text, where));
        (b.hints ?? []).forEach((h) => checkDollars(h, where));
      }
      if (b.kind === "numeric") {
        checkDollars(b.prompt, where);
        checkDollars(b.explain, where);
        b.hints.forEach((h) => checkDollars(h, where));
        if (b.exact) checkDollars(b.exact, where);
      }
      if (b.kind === "table") {
        b.headers.forEach((h) => checkDollars(h, where));
        b.rows.forEach((r) => r.forEach((c) => checkDollars(c, where)));
      }
    }
  }
}

// 9. ช่องที่เรนเดอร์เป็นสูตรล้วน ต้องไม่มี $ คั่น — ใส่ $ ลงไปจะทำให้ KaTeX พังทั้งก้อน
//    (ข้อความไทยในช่องพวกนี้ต้องห่อด้วย \text{...})
function checkRawLatex(latex: string, where: string, field: string) {
  if (latex.includes("$")) {
    err(`${where}: ${field} เป็นสูตรล้วนอยู่แล้ว ห้ามใส่ $ — "${latex.slice(0, 50)}…"`);
  }
}
for (const l of lessons) {
  for (const s of l.sections) {
    for (const b of s.blocks) {
      const where = `${l.slug}/${s.id}`;
      if (b.kind === "math") checkRawLatex(b.latex, where, "math.latex");
      if (b.kind === "worked") {
        checkRawLatex(b.answer, where, "worked.answer");
        b.steps.forEach((st) => {
          if (st.latex) checkRawLatex(st.latex, where, "worked.steps[].latex");
          checkDollars(st.text, where);
        });
        checkDollars(b.prompt, where);
      }
    }
  }
}

// 10. ตำแหน่งคำตอบที่ถูกต้องกระจายพอหรือไม่
//     เนื้อหาเขียนโดยวางคำตอบถูกไว้ข้อแรกเพื่อตรวจง่าย ระบบจึงสลับตัวเลือกตอนเรนเดอร์ให้
//     ตัวเลขนี้มีไว้เตือนถ้าวันหนึ่งมีคนถอดการสลับออก แล้วลืมกระจายคำตอบในข้อมูลจริง
{
  const pos = [0, 0, 0, 0, 0, 0];
  let n = 0;
  for (const l of lessons) {
    for (const s of l.sections) {
      for (const b of s.blocks) {
        if (b.kind !== "quiz") continue;
        const i = b.choices.findIndex((c) => c.correct);
        if (i >= 0) {
          pos[i] = (pos[i] ?? 0) + 1;
          n++;
        }
      }
    }
  }
  const first = pos[0] ?? 0;
  if (n > 0 && first / n > 0.5) {
    warn(
      `คำตอบที่ถูกอยู่ข้อแรก ${first}/${n} ข้อ — พึ่งการสลับตัวเลือกตอนเรนเดอร์อยู่ ` +
        `(shuffleWithSeed ใน src/lib/quiz.ts) ถ้าถอดออกเมื่อไรต้องกระจายคำตอบในข้อมูลก่อน`,
    );
  }
}

// 11. แนวทางขั้นแรกต้องเป็นคำถามหรือทิศทาง ไม่ใช่วิธีทำสำเร็จรูป
//     เจตนาของแนวทางคือจุดประกายให้คิดต่อ ถ้าขั้นแรกบอกวิธีทำหมดก็เท่ากับเฉลย
{
  const GIVEAWAY = /^(แทน|คำนวณ|ได้|เท่ากับ|คำตอบ|ใช้สูตร .* แล้วได้)/;
  for (const l of lessons) {
    for (const s of l.sections) {
      for (const b of s.blocks) {
        const hints = b.kind === "numeric" ? b.hints : b.kind === "quiz" ? b.hints : undefined;
        if (!hints || hints.length === 0) continue;
        const first = hints[0]!;
        if (GIVEAWAY.test(first.trim())) {
          warn(`${l.slug}/${s.id}: แนวทางขั้นแรกออกแนวบอกวิธีทำ — "${first.slice(0, 40)}…"`);
        }
        if (hints.some((h) => h.trim().length < 10)) {
          warn(`${l.slug}/${s.id}: มีแนวทางที่สั้นเกินจนไม่ช่วยอะไร`);
        }
      }
    }
  }
}

// 12. สัดส่วนข้อที่เดาไม่ได้ — ปรนัยล้วนทำให้ผู้เรียนคิดว่าตัวเองเก่งกว่าความจริง
{
  let choice = 0;
  let numeric = 0;
  for (const l of lessons) {
    for (const s of l.sections) {
      if (!["guided", "practice", "challenge"].includes(s.type)) continue;
      for (const b of s.blocks) {
        if (b.kind === "quiz") choice++;
        if (b.kind === "numeric") numeric++;
      }
    }
  }
  const total = choice + numeric;
  console.log(`  · โจทย์ฝึก ${total} ข้อ — ปรนัย ${choice} · กรอกคำตอบเอง ${numeric}`);
  if (total > 0 && numeric / total < 0.2) {
    warn(
      `ข้อที่เดาไม่ได้มีเพียง ${numeric}/${total} ข้อ (${Math.round((numeric / total) * 100)}%) — ` +
        `ควรมีอย่างน้อย 20% ไม่งั้นคะแนนจะสะท้อนการเดาปนอยู่มาก`,
    );
  }
}

// 13. สัญลักษณ์ต้องถูกบอกวิธีอ่านก่อนใช้ — เห็นสัญลักษณ์ที่ยังอ่านไม่ออก ผู้เรียนจะหลุดทันที
//     กติกาคือบทไหนใช้สัญลักษณ์เหล่านี้ ต้องมีที่ใดที่หนึ่งในบทบอกว่า "อ่านว่า" อะไร
//     (ปกติคือตาราง “อ่านสัญลักษณ์ก่อน” ต้นบท) หรืออย่างน้อยต้องมีคำอ่านไทยของสัญลักษณ์นั้นปรากฏอยู่
{
  /**
   * เพิ่มสัญลักษณ์ใหม่ได้ที่นี่ — คำอ่านไทยใส่ได้หลายแบบ เจอแบบใดแบบหนึ่งก็ถือว่าบอกแล้ว
   * notAfter คือตัวอักษรที่ถ้ามาก่อนหน้าให้ข้ามไป เช่น $90^\\circ$ คือองศา ไม่ใช่การประกอบฟังก์ชัน
   */
  const SYMBOLS: { latex: string; readings: string[]; notAfter?: string }[] = [
    { latex: "\\forall", readings: ["สำหรับทุก"] },
    { latex: "\\exists", readings: ["มีบางตัว", "มีอย่างน้อยหนึ่ง", "มีสมาชิกบางตัว"] },
    { latex: "\\equiv", readings: ["สมมูล"] },
    { latex: "\\Delta", readings: ["เดลตา"] },
    { latex: "\\lim", readings: ["ลิมิต"] },
    { latex: "\\sum", readings: ["ซิกมา", "ผลรวม"] },
    { latex: "\\int", readings: ["อินทิกรัล", "ปริพันธ์"] },
    { latex: "\\circ", readings: ["คอมโพสิต", "ประกอบ"], notAfter: "^" },
    { latex: "\\vec", readings: ["เวกเตอร์"] },
    { latex: "\\cap", readings: ["อินเตอร์เซกชัน", "อินเตอร์เซคชัน", "ส่วนร่วม"] },
    { latex: "\\cup", readings: ["ยูเนียน"] },
    { latex: "\\subset", readings: ["สับเซต"] },
  ];

  /** รวมข้อความทุกช่องของบทเป็นก้อนเดียว เพื่อค้นทั้งสัญลักษณ์และคำอ่าน */
  const lessonText = (l: (typeof lessons)[number]) => {
    const out: string[] = [];
    for (const s of l.sections) {
      if (s.title) out.push(s.title);
      for (const b of s.blocks) {
        if (b.kind === "paragraph") out.push(b.text);
        if (b.kind === "math") out.push(b.latex, b.note ?? "");
        if (b.kind === "list") out.push(...b.items);
        if (b.kind === "callout") out.push(b.title ?? "", b.text);
        if (b.kind === "table") {
          out.push(b.caption ?? "", ...b.headers, ...b.rows.flat());
        }
        if (b.kind === "worked") {
          out.push(b.prompt, b.answer);
          b.steps.forEach((st) => out.push(st.text, st.latex ?? ""));
        }
        if (b.kind === "quiz") {
          out.push(b.prompt, b.explain, b.hint ?? "", ...(b.hints ?? []));
          b.choices.forEach((c) => out.push(c.text));
        }
        if (b.kind === "numeric") {
          out.push(b.prompt, b.explain, b.exact ?? "", ...b.hints);
        }
      }
    }
    return out.join("\n");
  };

  for (const l of lessons) {
    const text = lessonText(l);
    const tellsHowToRead = text.includes("อ่านว่า");
    for (const sym of SYMBOLS) {
      // ขอบเขตคำ: กัน \int ไปชนกับ \intercal หรือ \cap ชนกับ \capsule
      const before = sym.notAfter ? `(?<!\\${sym.notAfter})` : "";
      const used = new RegExp(`${before}\\\\${sym.latex.slice(1)}(?![a-zA-Z])`).test(text);
      if (!used) continue;
      if (tellsHowToRead) continue;
      if (sym.readings.some((r) => text.includes(r))) continue;
      warn(
        `${l.slug}: ใช้สัญลักษณ์ ${sym.latex} แต่ไม่มีที่ใดในบทบอกว่าอ่านว่าอะไร — ` +
          `เพิ่มตาราง “อ่านสัญลักษณ์ก่อน” หรือเขียนคำอ่าน (${sym.readings[0]}) ไว้ก่อนใช้ครั้งแรก`,
      );
    }
  }
}

// สรุป
const totalSections = lessons.reduce((n, l) => n + l.sections.length, 0);
const totalMinutes = lessons.reduce((n, l) => n + l.estimatedMinutes, 0);
console.log(`\n--- สรุป ---`);
console.log(`หลักสูตร ${courses.length} · บท ${chapters.length} · หัวข้อ ${topics.length}`);
console.log(`บทเรียนที่เผยแพร่แล้ว ${lessons.length} บท · ${totalSections} ขั้น · รวม ${totalMinutes} นาที`);
console.log(`ควิซ ${quizCount} ข้อ · กราฟที่ฝังในบทเรียน ${vizCount} จุด · กราฟในทะเบียน ${VIZ_KEYS.length} แบบ`);

if (errors > 0) {
  console.log(`\n✗ พบข้อผิดพลาด ${errors} จุด${warnings ? ` และคำเตือน ${warnings} จุด` : ""}\n`);
  process.exit(1);
}
console.log(`\n✓ ผ่านทั้งหมด${warnings ? ` (มีคำเตือน ${warnings} จุด)` : ""}\n`);
