import type { Game } from "@/lib/api";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatScore(game?: Pick<Game, "home_score" | "away_score"> | null) {
  if (!game || game.home_score === null || game.away_score === null) {
    return "점수 미정";
  }

  return `${game.home_score} : ${game.away_score}`;
}

export function getGameSummary(game: Game) {
  return `${game.home_team} vs ${game.away_team}`;
}
