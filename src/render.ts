import katex from "katex";

/**
 * แปลงสูตรเป็น HTML ตั้งแต่ตอน build
 * โค้ดในไฟล์นี้ต้องไม่ถูกเรียกจาก component ฝั่ง client เด็ดขาด
 * มิฉะนั้น KaTeX (~90KB) จะถูกส่งไปให้เบราว์เซอร์โหลดโดยไม่จำเป็น
 */
export function renderMath(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return `<span style="color:var(--danger)">[สูตรผิดรูปแบบ]</span>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** สูตรและข้อความธรรมดาปนกัน (ยังไม่จัดการตัวหนา) */
function renderInline(text: string): string {
  return text
    .split(/(\$[^$]+\$)/g)
    .map((part) =>
      part.startsWith("$") && part.endsWith("$") && part.length > 2
        ? renderMath(part.slice(1, -1), false)
        : escapeHtml(part),
    )
    .join("");
}

/**
 * ข้อความที่มี **ตัวหนา** และ $สูตร$ ปนกัน
 * ต้องแยกตัวหนาก่อนสูตร มิฉะนั้นตัวหนาที่คร่อมสูตรอยู่จะถูกตัดขาดจนไม่จับคู่กัน
 */
export function renderRich(text: string): string {
  return text
    .split(/(\*\*[^*]+(?:\*(?!\*)[^*]*)*\*\*)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? `<strong style="font-weight:600;color:var(--ink)">${renderInline(part.slice(2, -2))}</strong>`
        : renderInline(part),
    )
    .join("");
}
