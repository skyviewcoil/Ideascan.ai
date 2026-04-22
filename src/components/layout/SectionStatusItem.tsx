import type { SectionInsight, SectionKey } from "@/types";
import { SECTION_LABELS } from "@/types";

interface SectionStatusItemProps {
  section: SectionKey;
  insight?: SectionInsight;
}

const STATUS_DOT: Record<SectionInsight["status"], string> = {
  empty: "bg-border",
  weak: "bg-warning",
  ok: "bg-info",
  strong: "bg-success",
};

const STATUS_LABEL: Record<SectionInsight["status"], string> = {
  empty: "טרם נבדק",
  weak: "חלש",
  ok: "סביר",
  strong: "חזק",
};

export function SectionStatusItem({ section, insight }: SectionStatusItemProps) {
  const status = insight?.status ?? "empty";
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
        <span className="text-body">{SECTION_LABELS[section]}</span>
      </div>
      <span className="text-small text-muted-foreground">{STATUS_LABEL[status]}</span>
    </div>
  );
}
