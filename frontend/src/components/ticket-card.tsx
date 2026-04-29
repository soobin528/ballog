import Link from "next/link";
import type { CSSProperties } from "react";

import type { Entry, Game } from "@/lib/api";
import { formatDate, formatScore } from "@/lib/format";
import { getTeamColors } from "@/lib/kbo";

type TicketCardProps = {
  entry: Entry;
  game?: Game | null;
  href?: string;
  variant?: "card" | "large" | "list";
};

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  "SSG Landers": { primary: "#CE0E2D", secondary: "#111111" },
  "Doosan Bears": { primary: "#131230", secondary: "#FFFFFF" },
  "LG Twins": { primary: "#C30452", secondary: "#111111" },
  "Kiwoom Heroes": { primary: "#6F263D", secondary: "#F5D0A9" },
  "KT Wiz": { primary: "#000000", secondary: "#ED1C24" },
  "Samsung Lions": { primary: "#074CA1", secondary: "#C0C0C0" },
  "Lotte Giants": { primary: "#002955", secondary: "#D00F31" },
  "KIA Tigers": { primary: "#EA0029", secondary: "#111111" },
  "Hanwha Eagles": { primary: "#F37321", secondary: "#111111" },
  "NC Dinos": { primary: "#315288", secondary: "#C7A45D" },
  "SSG 랜더스": { primary: "#CE0E2D", secondary: "#111111" },
  "두산 베어스": { primary: "#131230", secondary: "#FFFFFF" },
  "LG 트윈스": { primary: "#C30452", secondary: "#111111" },
  "키움 히어로즈": { primary: "#6F263D", secondary: "#F5D0A9" },
  "KT 위즈": { primary: "#000000", secondary: "#ED1C24" },
  "삼성 라이온즈": { primary: "#074CA1", secondary: "#C0C0C0" },
  "롯데 자이언츠": { primary: "#002955", secondary: "#D00F31" },
  "KIA 타이거즈": { primary: "#EA0029", secondary: "#111111" },
  "한화 이글스": { primary: "#F37321", secondary: "#111111" },
  "NC 다이노스": { primary: "#315288", secondary: "#C7A45D" },
};

function getOpponent(entry: Entry, game?: Game | null) {
  if (!game) {
    return "상대팀";
  }

  return entry.watched_team === game.home_team ? game.away_team : game.home_team;
}

function getWatchedScore(entry: Entry, game?: Game | null) {
  if (!game || game.home_score == null || game.away_score == null) {
    return "-";
  }

  return entry.watched_team === game.home_team
    ? String(game.home_score)
    : String(game.away_score);
}

function getOpponentScore(entry: Entry, game?: Game | null) {
  if (!game || game.home_score == null || game.away_score == null) {
    return "-";
  }

  return entry.watched_team === game.home_team
    ? String(game.away_score)
    : String(game.home_score);
}

function getTicketResult(entry: Entry, game?: Game | null) {
  if (entry.is_win === true) {
    return "WIN";
  }

  if (entry.is_win === false) {
    return "LOSE";
  }

  if (!game || game.home_score == null || game.away_score == null) {
    return "READY";
  }

  const watchedScore = Number(getWatchedScore(entry, game));
  const opponentScore = Number(getOpponentScore(entry, game));

  if (Number.isNaN(watchedScore) || Number.isNaN(opponentScore)) {
    return "READY";
  }

  return watchedScore > opponentScore ? "WIN" : "LOSE";
}

function getTicketResultLabel(result: string) {
  if (result === "WIN") {
    return "승리";
  }

  if (result === "LOSE") {
    return "패배";
  }

  return "예정";
}

function getTicketStyle(entry: Entry, result: string) {
  const colors = TEAM_COLORS[entry.watched_team] ?? getTeamColors(entry.watched_team);

  return {
    "--ticket-team": colors.primary,
    "--ticket-team-secondary": colors.secondary,
    "--ticket-result": result === "LOSE" ? "#91A7C7" : "#FFE28A",
    "--ticket-glow":
      result === "LOSE" ? "rgba(49, 82, 136, 0.28)" : "rgba(242, 194, 48, 0.5)",
  } as CSSProperties;
}

export function TicketCard({ entry, game, href, variant = "card" }: TicketCardProps) {
  const opponent = getOpponent(entry, game);
  const result = getTicketResult(entry, game);
  const resultLabel = getTicketResultLabel(result);
  const ticketStyle = getTicketStyle(entry, result);
  const venue = game?.stadium ?? "경기장 미정";
  const ticketDate = game?.game_date ?? entry.created_at;
  const mission = entry.missions[0];
  const content = (
    <article
      className={`ticket-card ticket-card--retro ticket-card--${result.toLowerCase()}${
        variant === "large" ? " ticket-card--large" : ""
      }${variant === "list" ? " ticket-card--list" : ""}`}
      style={ticketStyle}
    >
      <div className="ticket-card__holes ticket-card__holes--top" aria-hidden="true" />
      <div className="ticket-card__holes ticket-card__holes--bottom" aria-hidden="true" />
      <div className="ticket-card__corner ticket-card__corner--tl" aria-hidden="true" />
      <div className="ticket-card__corner ticket-card__corner--tr" aria-hidden="true" />
      <div className="ticket-card__corner ticket-card__corner--bl" aria-hidden="true" />
      <div className="ticket-card__corner ticket-card__corner--br" aria-hidden="true" />
      <div className="ticket-card__main">
        <div className="ticket-card__badge">KBO 2026</div>
        <div className="ticket-card__title">
          <span>{entry.watched_team}</span>
          <em>NO. BL-{String(entry.id).padStart(5, "0")}</em>
        </div>
        <dl className="ticket-card__details">
          <div>
            <dt>날짜</dt>
            <dd>{formatDate(ticketDate)}</dd>
          </div>
          <div>
            <dt>응원 팀</dt>
            <dd>{entry.watched_team}</dd>
          </div>
          <div>
            <dt>상대 팀</dt>
            <dd>{opponent}</dd>
          </div>
          <div>
            <dt>경기장</dt>
            <dd>{venue}</dd>
          </div>
        </dl>
        <div className="ticket-card__scoreboard" aria-label={`스코어 ${formatScore(game)}`}>
          <span>{getWatchedScore(entry, game)}</span>
          <i>:</i>
          <span>{getOpponentScore(entry, game)}</span>
        </div>
      </div>
      <div className="ticket-card__stub">
        <div className="ticket-card__stamp">{resultLabel}</div>
        <div className="ticket-card__stub-grid">
          <span>
            <small>날씨</small>
            ☀️
          </span>
          <span>
            <small>좌석</small>
            FAN-{String(entry.id).padStart(3, "0")}
          </span>
        </div>
        <div className="ticket-card__mission">
          <strong>미션</strong>
          {mission ? (
            <span>
              {mission.is_completed ? "X" : "□"} {mission.title}
            </span>
          ) : (
            <span>□ 미션 없음</span>
          )}
        </div>
        <div className="ticket-card__barcode" aria-hidden="true" />
        <span className="ticket-card__number">티켓 #{String(entry.id).padStart(6, "0")}</span>
      </div>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link className="ticket-card__link" href={href}>
      {content}
    </Link>
  );
}
