import Link from "next/link";

import type { Entry, Game } from "@/lib/api";
import { InlineState } from "@/components/inline-state";
import { TicketCard } from "@/components/ticket-card";

type RecentTicketPreviewProps = {
  entries: Entry[];
  error?: string | null;
  games?: Game[];
};

export function RecentTicketPreview({
  entries,
  error,
  games = [],
}: RecentTicketPreviewProps) {
  const gameById = new Map(games.map((game) => [game.id, game]));

  return (
    <section className="content-card recent-preview">
      <div className="recent-preview__header">
        <span className="recent-preview__eyebrow">RECENT TICKETBOOK</span>
        <h2>최근 직관 티켓</h2>
        <p>방금 만든 티켓들이 티켓북에 꽂히듯 차곡차곡 쌓여요.</p>
      </div>

      {error ? (
        <InlineState
          tone="error"
          title="최근 티켓을 불러오지 못했어요."
          description={error}
        />
      ) : entries.length > 0 ? (
        <>
          <div className="ticket-grid ticket-grid--compact recent-preview__grid">
            {entries.map((entry) => (
              <TicketCard
                key={entry.id}
                entry={entry}
                game={gameById.get(entry.game_id)}
                href={`/entries/${entry.id}`}
              />
            ))}
          </div>
          <div className="section-footer recent-preview__footer">
            <Link className="button button--ghost recent-preview__button" href="/collection">
              전체 티켓북 보기
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
