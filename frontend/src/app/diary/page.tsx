import { PageShell } from "@/components/page-shell";
import type { Entry, Game } from "@/lib/api";
import { fetchEntries, fetchGames } from "@/lib/api";

import { DiaryCalendarClient } from "./diary-calendar-client";

export default async function DiaryPage() {
  let games: Game[] = [];
  let entries: Entry[] = [];
  let error: string | null = null;

  try {
    [games, entries] = await Promise.all([fetchGames(), fetchEntries()]);
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : "일정과 직관 기록을 불러오지 못했습니다.";
  }

  return (
    <PageShell className="page-shell--diary">
      <DiaryCalendarClient entries={entries} error={error} games={games} />
    </PageShell>
  );
}
