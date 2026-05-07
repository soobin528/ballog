"use client";

import { useMemo, useState } from "react";

import type { Entry, Game } from "@/lib/api";

type DiaryCalendarClientProps = {
  entries: Entry[];
  error: string | null;
  games: Game[];
};

type ScheduledGameDate = {
  date: string;
  game: Game;
  matchup: string;
  stadium: string;
  time: string;
};

type WatchedEntryDate = {
  date: string;
  entry: Entry;
  game: Game;
  diary: string;
  matchup: string;
  result: string;
  title: string;
};

type CalendarCell = {
  day: number;
  dateKey: string;
} | null;

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getApiDateKey(value: string) {
  return value.slice(0, 10);
}

function getGameTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.includes("T") ? value.slice(11, 16) : "시간 미정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getMonthDays(date: Date): CalendarCell[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;

      return {
        day,
        dateKey: getDateKey(year, month, day),
      };
    }),
  ];
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getGameResult(game: Game) {
  if (game.home_score === null || game.away_score === null) {
    return game.status ?? "기록 완료";
  }

  return `${game.home_team} ${game.home_score}:${game.away_score} ${game.away_team}`;
}

export function DiaryCalendarClient({
  entries,
  error,
  games,
}: DiaryCalendarClientProps) {
  const today = useMemo(() => new Date(), []);
  const gameById = useMemo(
    () => new Map(games.map((game) => [game.id, game])),
    [games],
  );
  const scheduledGameDates = useMemo<ScheduledGameDate[]>(
    () =>
      games.map((game) => ({
        date: getApiDateKey(game.game_date),
        game,
        matchup: `${game.away_team} vs ${game.home_team}`,
        stadium: game.stadium ?? "경기장 미정",
        time: getGameTime(game.game_date),
      })),
    [games],
  );
  const watchedEntryDates = useMemo<WatchedEntryDate[]>(
    () =>
      entries.flatMap((entry) => {
        const game = gameById.get(entry.game_id);

        if (!game) {
          return [];
        }

        return [
          {
            date: getApiDateKey(game.game_date),
            entry,
            game,
            diary:
              entry.diary_text ??
              entry.memo ??
              "아직 다이어리 내용이 없어요. 오늘의 장면을 조금 더 남겨보세요.",
            matchup: `${game.away_team} vs ${game.home_team}`,
            result: getGameResult(game),
            title: entry.diary_text ? "직관 다이어리" : `${entry.watched_team} 직관 기록`,
          },
        ];
      }),
    [entries, gameById],
  );
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    getDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const monthLabel = getMonthLabel(visibleMonth);
  const selectedDay = Number(selectedDate.slice(-2));
  const selectedSchedules = scheduledGameDates.filter(
    (game) => game.date === selectedDate,
  );
  const selectedEntries = watchedEntryDates.filter(
    (entry) => entry.date === selectedDate,
  );

  function getMonthSelection(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthPrefix = `${year}-${pad(month + 1)}`;
    const highlightedDate =
      watchedEntryDates.find((entry) => entry.date.startsWith(monthPrefix))
        ?.date ??
      scheduledGameDates.find((game) => game.date.startsWith(monthPrefix))?.date;

    return highlightedDate ?? getDateKey(year, month, 1);
  }

  function moveMonth(offset: number) {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + offset,
        1,
      );
      setSelectedDate(getMonthSelection(nextMonth));
      return nextMonth;
    });
  }

  return (
    <>
      <section className="diary-month-card" aria-labelledby="diary-title">
        <div className="diary-month-card__header">
          <span className="diary-month-card__eyebrow">DIARY</span>
          <div>
            <h1 id="diary-title">{monthLabel}</h1>
            <p>경기 일정은 파란 점, 직관 기록은 머스터드 날짜로 표시해요.</p>
          </div>
        </div>

        <div className="diary-month-nav" aria-label="월 이동">
          <button type="button" onClick={() => moveMonth(-1)}>
            이전
          </button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => moveMonth(1)}>
            다음
          </button>
        </div>

        <div className="diary-calendar" aria-label={`${monthLabel} 경기 일정`}>
          <div className="diary-calendar__weekdays" aria-hidden="true">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="diary-calendar__grid">
            {monthDays.map((cell, index) => {
              const hasScheduledGame = cell
                ? scheduledGameDates.some((game) => game.date === cell.dateKey)
                : false;
              const hasWatchedEntry = cell
                ? watchedEntryDates.some((entry) => entry.date === cell.dateKey)
                : false;
              const isSelected = cell?.dateKey === selectedDate;

              return cell ? (
                <button
                  aria-label={`${cell.day}일${
                    hasWatchedEntry
                      ? " 직관 기록 있음"
                      : hasScheduledGame
                        ? " 경기 일정 있음"
                        : ""
                  }`}
                  aria-pressed={isSelected}
                  className={`diary-date-ball${
                    isSelected ? " diary-date-ball--selected" : ""
                  }${hasScheduledGame ? " diary-date-ball--game" : ""}${
                    hasWatchedEntry ? " diary-date-ball--watched" : ""
                  }`}
                  key={cell.dateKey}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  type="button"
                >
                  <span>{cell.day}</span>
                  {hasScheduledGame ? <i aria-hidden="true" /> : null}
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="diary-calendar__empty"
                  key={`empty-${index}`}
                />
              );
            })}
          </div>
        </div>

        <div className="diary-legend" aria-label="캘린더 표시 안내">
          <span>
            <i className="diary-legend__dot" aria-hidden="true" />
            경기 일정
          </span>
          <span>
            <i className="diary-legend__stamp" aria-hidden="true" />
            직관 기록
          </span>
        </div>
      </section>

      <section className="diary-schedule" aria-labelledby="schedule-title">
        <div className="diary-schedule__header">
          <span>선택한 날짜</span>
          <strong id="schedule-title">{selectedDay}일</strong>
        </div>

        {error ? <p className="diary-empty-note diary-empty-note--error">{error}</p> : null}

        <div className="diary-day-panel">
          <div className="diary-day-panel__section">
            <div className="diary-day-panel__title">
              <i className="diary-legend__stamp" aria-hidden="true" />
              <strong>직관 기록</strong>
            </div>
            {selectedEntries.length > 0 ? (
              <div className="diary-entry-list">
                {selectedEntries.map((entry) => (
                  <article className="diary-entry-card" key={entry.entry.id}>
                    <span>{entry.matchup}</span>
                    <strong>{entry.title}</strong>
                    <p>{entry.diary}</p>
                    <em>{entry.result}</em>
                  </article>
                ))}
              </div>
            ) : (
              <p className="diary-empty-note">아직 남긴 직관 기록이 없어요.</p>
            )}
          </div>

          <div className="diary-day-panel__section">
            <div className="diary-day-panel__title">
              <i className="diary-legend__dot" aria-hidden="true" />
              <strong>경기 일정</strong>
            </div>
            {selectedSchedules.length > 0 ? (
              <div className="diary-schedule__list">
                {selectedSchedules.map((game) => (
                  <p className="diary-game-line" key={game.game.id}>
                    <span>{game.time}</span>
                    <strong>{game.matchup}</strong>
                    <em>{game.stadium}</em>
                  </p>
                ))}
              </div>
            ) : (
              <p className="diary-empty-note">등록된 경기 일정이 없어요.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
