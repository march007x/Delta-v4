import type { Block } from "@/content/schema";
import { renderMath, renderRich } from "@/lib/math/render";
import { shuffleWithSeed } from "@/lib/quiz";
import { CalloutBlock, MathBlock, TableBlock } from "./StaticBlocks";
import { VizByKey } from "@/components/viz/registry";
import { NumericQuestion, Quiz } from "./Quiz";
import { Worked } from "./Worked";

/** เรนเดอร์บนเซิร์ฟเวอร์ทั้งหมด ยกเว้นส่วนที่ต้องโต้ตอบจริง ๆ (ควิซ ตัวอย่างทีละขั้น กราฟ) */
export function BlockRenderer({ block, seed = "" }: { block: Block; seed?: string }) {
  switch (block.kind) {
    case "paragraph":
      return (
        <p
          className="my-3 max-w-[68ch] text-[16px] leading-[1.8] text-ink-2"
          dangerouslySetInnerHTML={{ __html: renderRich(block.text) }}
        />
      );

    case "math":
      return <MathBlock latex={block.latex} note={block.note} />;

    case "list": {
      const cls = `my-3 max-w-[68ch] pl-5 text-[16px] leading-[1.8] text-ink-2 ${
        block.ordered ? "list-decimal" : "list-disc"
      }`;
      const items = block.items.map((item, i) => (
        <li key={i} className="mb-1.5" dangerouslySetInnerHTML={{ __html: renderRich(item) }} />
      ));
      return block.ordered ? <ol className={cls}>{items}</ol> : <ul className={cls}>{items}</ul>;
    }

    case "callout":
      return <CalloutBlock tone={block.tone} title={block.title} text={block.text} />;

    case "viz":
      return <VizByKey componentKey={block.componentKey} config={block.config} />;

    case "worked":
      return (
        <Worked
          promptHtml={renderRich(block.prompt)}
          steps={block.steps.map((s) => ({
            textHtml: renderRich(s.text),
            latexHtml: s.latex ? renderMath(s.latex, true) : undefined,
          }))}
          answerHtml={renderMath(block.answer, true)}
        />
      );

    case "table":
      return <TableBlock caption={block.caption} headers={block.headers} rows={block.rows} />;

    case "quiz":
      return (
        <Quiz
          promptHtml={renderRich(block.prompt)}
          choices={shuffleWithSeed(block.choices, seed).map((c) => ({
            html: renderRich(c.text),
            correct: c.correct,
          }))}
          explainHtml={renderRich(block.explain)}
          hintsHtml={(block.hints ?? (block.hint ? [block.hint] : [])).map(renderRich)}
        />
      );

    case "numeric":
      return (
        <NumericQuestion
          promptHtml={renderRich(block.prompt)}
          answer={block.answer}
          tolerance={block.tolerance}
          exactHtml={block.exact ? renderRich(block.exact) : undefined}
          unit={block.unit}
          hintsHtml={block.hints.map(renderRich)}
          explainHtml={renderRich(block.explain)}
        />
      );
  }
}
