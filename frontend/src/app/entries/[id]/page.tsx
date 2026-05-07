import { InlineState } from "@/components/inline-state";
import { PageShell } from "@/components/page-shell";
import { fetchEntry, fetchGame } from "@/lib/api";
import { formatDate, formatScore, getGameSummary } from "@/lib/format";

import { ResultTicketActions } from "./result-ticket-actions";

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
    const opponent =
      entry.watched_team === game.home_team ? game.away_team : game.home_team;
    const resultLabel =
      entry.is_win === true ? "승리의 직관!" : entry.is_win === false ? "다음 경기를 기약해요" : "기록 완료";
    const resultCopy =
      entry.is_win === true
        ? `${entry.watched_team}를 응원한 보람이 반짝였던 날이에요.`
        : entry.is_win === false
          ? `아쉬워도 오래 남을 ${entry.watched_team} 직관 기록이에요.`
          : "승패보다 현장의 분위기를 먼저 남겼어요.";

    return (
      <PageShell className="page-shell--result">
        <section className="result-created">
          <div className="result-created__hero">
            <span className="result-created__icon">🎟️</span>
            <span className="section-heading__eyebrow">티켓 생성 완료</span>
            <h1>티켓이 생성되었습니다</h1>
            <p>{entry.watched_team}의 오늘 직관을 Ballog 티켓으로 저장했어요.</p>
          </div>

          <ResultTicketActions entry={entry} game={game} />

          <article className="result-card result-card--info">
            <span className="section-heading__eyebrow">경기 정보</span>
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
                <dt>매치업</dt>
                <dd>{entry.watched_team} vs {opponent}</dd>
              </div>
              <div>
                <dt>날씨</dt>
                <dd>야구장 날씨</dd>
              </div>
              <div>
                <dt>동행</dt>
                <dd>{entry.watched_team}</dd>
              </div>
            </dl>
          </article>

          <article className="result-card result-card--diary">
            <span className="section-heading__eyebrow">오늘의 다이어리</span>
            <h2>오늘의 직관 일기</h2>
            <p className="result-diary">{entry.diary_text ?? entry.memo ?? "일기 문장이 아직 없어요."}</p>
          </article>

          <article className={`result-card result-card--result${entry.is_win === false ? " result-card--lose" : ""}`}>
            <span className="section-heading__eyebrow">경기 결과</span>
            <h2>{resultLabel}</h2>
            <p>{resultCopy}</p>
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
