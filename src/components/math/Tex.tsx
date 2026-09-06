import { renderMath, renderRich } from "@/lib/math/render";

export function TexInline({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderMath(children, false) }} />;
}

export function TexBlock({ children }: { children: string }) {
  return (
    <div
      className="my-3 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: renderMath(children, true) }}
    />
  );
}

/** ข้อความผสมสูตร — เรนเดอร์บนเซิร์ฟเวอร์ ไม่ส่ง KaTeX ไปฝั่งผู้ใช้ */
export function RichText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderRich(text) }} />;
}
