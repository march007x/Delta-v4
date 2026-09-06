/**
 * ไอคอนเส้นชุดเดียวของทั้งเว็บ
 *
 * วาดเองด้วย path สั้น ๆ แทนการดึงไลบรารีไอคอนเข้ามา เพราะใช้จริงไม่ถึงยี่สิบตัว
 * ทุกตัวอยู่บนกริด 24 หน่วย ความหนาเส้นเท่ากันหมด จึงดูเป็นชุดเดียวกันเมื่อวางเรียงในเมนู
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5M9.5 20v-6h5v6",
  book: "M4 4.5h6.5a2 2 0 0 1 2 2V20a2.2 2.2 0 0 0-2-1.2H4zM20 4.5h-6.5a2 2 0 0 0-2 2V20a2.2 2.2 0 0 1 2-1.2H20z",
  pencil: "M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17zM14.5 6.5l3 3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2",
  flask: "M9.5 3v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3l-5-9V3M8 3h8M7.6 14h8.8",
  sigma: "M6.5 4.5h11l-6.5 7.5 6.5 7.5h-11",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM16.2 16.2 21 21",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z",
  monitor: "M3 5h18v11H3zM9 20h6M12 16v4",
  check: "M4.5 12.5 9.5 17.5 19.5 6.5",
  chevron: "m9 5 7 7-7 7",
  arrow: "M4 12h15M13 6l6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
