"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { TicketCard } from "@/components/ticket-card";
import type { Entry, Game } from "@/lib/api";

type ResultTicketActionsProps = {
  entry: Entry;
  game: Game;
};

function getOpponent(entry: Entry, game: Game) {
  return entry.watched_team === game.home_team ? game.away_team : game.home_team;
}

function getWatchedScore(entry: Entry, game: Game) {
  if (game.home_score == null || game.away_score == null) {
    return "-";
  }

  return entry.watched_team === game.home_team
    ? String(game.home_score)
    : String(game.away_score);
}

function getOpponentScore(entry: Entry, game: Game) {
  if (game.home_score == null || game.away_score == null) {
    return "-";
  }

  return entry.watched_team === game.home_team
    ? String(game.away_score)
    : String(game.home_score);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createTicketSvg(entry: Entry, game: Game) {
  const opponent = getOpponent(entry, game);
  const diary = entry.diary_text ?? entry.memo ?? "오늘의 직관 기록";
  const result = entry.is_win === true ? "승리" : entry.is_win === false ? "패배" : "기록";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <rect width="1200" height="675" fill="#fff4d8"/>
    <rect x="50" y="60" width="1100" height="555" rx="34" fill="#4b673f"/>
    <rect x="72" y="82" width="1056" height="511" rx="28" fill="none" stroke="#fff8e8" stroke-width="4" opacity=".55"/>
    <line x1="790" y1="100" x2="790" y2="575" stroke="#fff8e8" stroke-width="6" stroke-dasharray="16 16" opacity=".55"/>
    <text x="100" y="150" fill="#fff8e8" font-size="46" font-weight="900" font-family="Arial, sans-serif">BALLOG TICKET</text>
    <text x="100" y="235" fill="#d7c8a4" font-size="24" font-weight="800" font-family="Arial, sans-serif">경기장</text>
    <text x="100" y="278" fill="#fff8e8" font-size="38" font-weight="900" font-family="Arial, sans-serif">${escapeXml(game.stadium ?? "경기장 미정")}</text>
    <text x="100" y="350" fill="#d7c8a4" font-size="24" font-weight="800" font-family="Arial, sans-serif">매치업</text>
    <text x="100" y="393" fill="#fff8e8" font-size="36" font-weight="900" font-family="Arial, sans-serif">${escapeXml(entry.watched_team)} vs ${escapeXml(opponent)}</text>
    <text x="100" y="465" fill="#d7c8a4" font-size="24" font-weight="800" font-family="Arial, sans-serif">스코어</text>
    <text x="100" y="508" fill="#ffe28a" font-size="50" font-weight="900" font-family="Arial, sans-serif">${getWatchedScore(entry, game)} : ${getOpponentScore(entry, game)}</text>
    <text x="100" y="565" fill="#fff8e8" font-size="24" font-weight="700" font-family="Arial, sans-serif">${escapeXml(diary.slice(0, 46))}</text>
    <rect x="860" y="155" width="190" height="190" rx="24" fill="#fff8e8"/>
    <text x="955" y="270" text-anchor="middle" fill="#4b673f" font-size="48" font-weight="900" font-family="Arial, sans-serif">${escapeXml(entry.watched_team.split(" ")[0])}</text>
    <text x="955" y="430" text-anchor="middle" fill="#fff8e8" font-size="42" font-weight="900" font-family="Arial, sans-serif">${escapeXml(entry.watched_team)}</text>
    <text x="955" y="480" text-anchor="middle" fill="#d7c8a4" font-size="26" font-weight="800" font-family="Arial, sans-serif">ENTRY #${entry.id}</text>
    <rect x="865" y="515" width="180" height="58" rx="29" fill="#ffe046"/>
    <text x="955" y="554" text-anchor="middle" fill="#5b361f" font-size="28" font-weight="900" font-family="Arial, sans-serif">${result}</text>
  </svg>`;
}

function downloadTicketImage(entry: Entry, game: Game) {
  const svgBlob = new Blob([createTicketSvg(entry, game)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  const link = document.createElement("a");
  link.href = svgUrl;
  link.download = `balllog-ticket-${entry.id}.svg`;
  link.click();
  URL.revokeObjectURL(svgUrl);
}

export function ResultTicketActions({ entry, game }: ResultTicketActionsProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = `${entry.watched_team} 직관 티켓`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Balllog에 남긴 직관 티켓이에요.",
          url: shareUrl,
        });
        setMessage("공유 창을 열었어요.");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setMessage("티켓 링크를 복사했어요.");
    } catch {
      setMessage("공유를 취소했어요.");
    }
  };

  const handleSave = async () => {
    if (!ticketRef.current) {
      setMessage("저장할 티켓을 찾지 못했어요.");
      return;
    }

    try {
      downloadTicketImage(entry, game);
      setMessage("티켓 이미지를 SVG 파일로 저장했어요.");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "티켓 저장에 실패했어요.",
      );
    }
  };

  return (
    <>
      <article className="result-ticket-stage" aria-label="생성된 티켓">
        <div ref={ticketRef}>
          <TicketCard entry={entry} game={game} variant="large" />
        </div>
      </article>

      <div className="result-actions result-actions--stacked">
        <Link className="button button--primary button--wide" href="/collection">
          컬렉션에서 모든 티켓 보기
        </Link>
        <button className="button button--ghost" type="button" onClick={handleShare}>
          공유
        </button>
        <button className="button button--ghost" type="button" onClick={handleSave}>
          저장
        </button>
        <Link className="button button--ghost button--wide" href="/">
          홈으로 돌아가기
        </Link>
      </div>

      {message ? <p className="result-action-message">{message}</p> : null}
    </>
  );
}
