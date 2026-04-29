import Link from "next/link";

import { HeroSection } from "@/components/hero-section";
import { PageShell } from "@/components/page-shell";
import { RecentTicketPreview } from "@/components/recent-ticket-preview";
import { type Entry, type Game, fetchEntries, fetchGames } from "@/lib/api";

export default async function HomePage() {
  let entries: Entry[] = [];
  let games: Game[] = [];
  let recentEntries: Entry[] = [];
  let error: string | null = null;

  try {
    const [data, gamesData] = await Promise.all([fetchEntries(), fetchGames()]);
    entries = data;
    games = gamesData;
    recentEntries = data.slice(-3).reverse();
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "최근 티켓을 불러오지 못했습니다.";
  }

  const now = new Date();
  const totalTickets = entries.length;
  const totalWins = entries.filter((entry) => entry.is_win === true).length;
  const entriesThisMonth = entries.filter((entry) => {
    const createdAt = new Date(entry.created_at);
    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    return (
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth()
    );
  }).length;

  return (
    <PageShell className="page-shell--home">
      <HeroSection />
      <section className="home-stats" aria-label="직관 요약">
        <article className="home-stat-card home-stat-card--ticket">
          <span className="home-stat-card__icon">🎟️</span>
          <strong>총 티켓</strong>
          <em>{totalTickets}</em>
        </article>
        <article className="home-stat-card home-stat-card--win">
          <span className="home-stat-card__icon">🏆</span>
          <strong>승리</strong>
          <em>{totalWins}</em>
        </article>
        <article className="home-stat-card home-stat-card--month">
          <span className="home-stat-card__icon">📅</span>
          <strong>이번달</strong>
          <em>{entriesThisMonth || totalTickets}</em>
        </article>
      </section>

      <section className="home-actions" aria-label="빠른 이동">
        <article className="home-action-card home-action-card--diary">
          <div className="home-action-card__icon">📖</div>
          <div className="home-action-card__copy">
            <strong>다이어리 보기</strong>
            <p>캘린더로 내 직관 기록 한눈에 보기</p>
          </div>
        </article>

        <Link className="home-action-card home-action-card--record" href="/create">
          <div className="home-action-card__icon">📝</div>
          <div className="home-action-card__copy">
            <strong>오늘의 직관 기록</strong>
            <p>경기 정보 입력하고 티켓 만들기</p>
          </div>
        </Link>

        <Link
          className="home-action-card home-action-card--collection"
          href="/collection"
        >
          <div className="home-action-card__icon">🎟️</div>
          <div className="home-action-card__copy">
            <strong>티켓 컬렉션</strong>
            <p>모은 티켓 보기</p>
          </div>
        </Link>
      </section>

      <RecentTicketPreview entries={recentEntries} error={error} games={games} />
    </PageShell>
  );
}
