import Link from "next/link";

import { HeroSection } from "@/components/hero-section";
import { PageShell } from "@/components/page-shell";
import { type Entry, type Game, fetchEntries, fetchGames } from "@/lib/api";
import { formatShortDate } from "@/lib/format";

export default async function HomePage() {
  let entries: Entry[] = [];
  let games: Game[] = [];
  let error: string | null = null;

  try {
    const [data, gamesData] = await Promise.all([fetchEntries(), fetchGames()]);
    entries = data;
    games = gamesData;
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "최근 다이어리를 불러오지 못했습니다.";
  }

  const latestEntry = entries.at(-1) ?? null;
  const latestGame = latestEntry
    ? games.find((game) => game.id === latestEntry.game_id) ?? null
    : null;
  const latestDiary = latestEntry?.diary_text ?? latestEntry?.memo ?? null;

  return (
    <PageShell className="page-shell--home">
      <HeroSection />

      <section className="home-diary-focus" aria-labelledby="home-diary-title">
        <div className="home-diary-focus__header">
          <span>최근 다이어리</span>
          <Link href="/diary">달력 보기</Link>
        </div>

        {error ? (
          <p className="home-diary-focus__empty">{error}</p>
        ) : latestEntry && latestDiary ? (
          <Link className="home-diary-focus__entry" href={`/entries/${latestEntry.id}`}>
            <span>
              {latestGame ? formatShortDate(latestGame.game_date) : "최근 기록"}
              {latestGame ? ` · ${latestGame.stadium ?? "경기장 미정"}` : ""}
            </span>
            <h2 id="home-diary-title">{latestEntry.watched_team} 직관 다이어리</h2>
            <p>{latestDiary}</p>
          </Link>
        ) : (
          <p className="home-diary-focus__empty">
            아직 남긴 다이어리가 없어요. 첫 직관을 기록하면 여기에 바로 보여요.
          </p>
        )}

        <div className="home-diary-focus__actions">
          <Link className="button button--primary" href="/create">
            직관 기록하기
          </Link>
          <Link className="button button--ghost" href="/diary">
            다이어리 열기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
