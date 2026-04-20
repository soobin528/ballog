import Link from "next/link";

import type { Entry } from "@/lib/api";
import { TicketCard } from "@/components/ticket-card";
import { SectionHeading } from "@/components/section-heading";
import { InlineState } from "@/components/inline-state";

type RecentTicketPreviewProps = {
  entries: Entry[];
  error?: string | null;
};

export function RecentTicketPreview({
  entries,
  error,
}: RecentTicketPreviewProps) {
  return (
    <section className="content-card">
      <SectionHeading
        eyebrow="RECENT TICKETS"
        title="최근 기록한 직관 티켓"
        description="방금 만든 티켓이 컬렉션에 어떻게 쌓이는지 미리 확인해보세요."
      />

      {error ? (
        <InlineState
          tone="error"
          title="최근 티켓을 불러오지 못했어요."
          description={error}
        />
      ) : entries.length > 0 ? (
        <>
          <div className="ticket-grid ticket-grid--compact">
            {entries.map((entry) => (
              <TicketCard key={entry.id} entry={entry} href={`/entries/${entry.id}`} />
            ))}
          </div>
          <div className="section-footer">
            <Link className="button button--ghost" href="/collection">
              전체 컬렉션 보기
            </Link>
          </div>
        </>
      ) : (
        <InlineState
          title="아직 기록된 티켓이 없어요."
          description="첫 직관을 기록하면 홈 화면에서 최근 티켓을 바로 볼 수 있어요."
        />
      )}
    </section>
  );
}
