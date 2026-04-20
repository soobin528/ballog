import Link from "next/link";

import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";
import { fetchEntry, fetchGame, getAssetUrl } from "@/lib/api";
import { formatDate, formatScore, getGameSummary } from "@/lib/format";

type ResultPageProps = {
  params: {
    id: string;
  };
};

export default async function ResultPage({ params }: ResultPageProps) {
  try {
    const { id } = params;
    const entry = await fetchEntry(id);
    const game = await fetchGame(entry.game_id);

    return (
      <PageShell>
        <section className="result-layout">
          <article className="result-card result-card--highlight">
            <span className="section-heading__eyebrow">RESULT</span>
            <h1>오늘의 직관 기록이 완성됐어요.</h1>
            <p className="result-diary">{entry.diary_text ?? "일기 문장이 아직 없어요."}</p>
            <div className="result-actions">
              <Link className="button button--primary" href="/collection">
                컬렉션 보러가기
              </Link>
              <Link className="button button--ghost" href="/create">
                새 기록 만들기
              </Link>
            </div>
          </article>

          <article className="result-card">
            <span className="section-heading__eyebrow">TICKET CARD</span>
            {entry.ticket_image_url ? (
              <img
                className="result-ticket-image"
                src={getAssetUrl(entry.ticket_image_url) ?? ""}
                alt={`${entry.watched_team} 티켓 카드`}
              />
            ) : (
              <div className="ticket-card__placeholder ticket-card__placeholder--large">
                TICKET IMAGE
              </div>
            )}
          </article>

          <article className="result-card">
            <span className="section-heading__eyebrow">GAME SUMMARY</span>
            <h2>{getGameSummary(game)}</h2>
            <dl className="summary-list">
              <div>
                <dt>경기장</dt>
                <dd>{game.stadium ?? "미정"}</dd>
              </div>
              <div>
                <dt>경기 일시</dt>
                <dd>{formatDate(game.game_date)}</dd>
              </div>
              <div>
                <dt>스코어</dt>
                <dd>{formatScore(game)}</dd>
              </div>
              <div>
                <dt>응원 팀</dt>
                <dd>{entry.watched_team}</dd>
              </div>
            </dl>
          </article>
        </section>
      </PageShell>
    );
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "결과 페이지를 불러오지 못했습니다.";

    return (
      <PageShell>
        <InlineState
          tone="error"
          title="결과를 불러오지 못했어요."
          description={message}
        />
      </PageShell>
    );
  }
}
