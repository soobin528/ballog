import Link from "next/link";

import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { fetchEntries, fetchGames } from "@/lib/api";
import { TicketList } from "./ticket-list";

export default async function CollectionPage() {
  try {
    const [entriesData, games] = await Promise.all([fetchEntries(), fetchGames()]);
    const entries = entriesData.slice().reverse();

    return (
      <PageShell className="page-shell--collection">
        <section className="collection-page">
          <Link className="collection-back" href="/">
            ← 뒤로가기
          </Link>
          <SectionHeading
            eyebrow="COLLECTION"
            title="내 직관 티켓 컬렉션"
            description="기록한 경기들을 티켓 카드 형태로 한눈에 모아보세요."
          />

          {entries.length > 0 ? (
            <TicketList entries={entries} games={games} />
          ) : (
            <InlineState
              title="아직 모인 티켓이 없어요."
              description="첫 직관 기록을 만들면 여기에 티켓 카드가 차곡차곡 쌓입니다."
            />
          )}

          <div className="section-footer">
            <Link className="button button--ghost" href="/create">
              새 직관 기록하기
            </Link>
          </div>
        </section>
      </PageShell>
    );
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "컬렉션을 불러오지 못했습니다.";

    return (
      <PageShell>
        <InlineState
          tone="error"
          title="컬렉션을 불러오지 못했어요."
          description={message}
        />
      </PageShell>
    );
  }
}
