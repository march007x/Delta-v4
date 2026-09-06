import { cx } from "@/lib/utils";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={cx("rounded-lg border border-line bg-surface p-5", className)}>
      {children}
    </Tag>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 mb-2 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-3">
      {children}
    </p>
  );
}
