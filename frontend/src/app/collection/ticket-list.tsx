"use client";

import { useMemo, useState } from "react";

import { InlineState } from "@/components/inline-state";
import { TicketCard } from "@/components/ticket-card";
import type { Entry, Game } from "@/lib/api";

type TicketListProps = {
  entries: Entry[];
  games: Game[];
};

type FilterKey = "all" | "wins" | "losses";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "wins", label: "승요만" },
  { key: "losses", label: "패요만" },
];

function getFilteredEntries(entries: Entry[], filter: FilterKey) {
  if (filter === "wins") {
    return entries.filter((entry) => entry.is_win === true);
  }

  if (filter === "losses") {
    return entries.filter((entry) => entry.is_win === false);
  }

  return entries;
}

export function TicketList({ entries, games }: TicketListProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const gameById = useMemo(
    () => new Map(games.map((game) => [game.id, game])),
    [games],
  );
  const filteredEntries = getFilteredEntries(entries, filter);
  const totalWins = entries.filter((entry) => entry.is_win === true).length;
  const totalLosses = entries.filter((entry) => entry.is_win === false).length;

  return (
    <>
      <section className="ticket-summary" aria-label="티켓 요약">
        <article className="ticket-summary-card ticket-summary-card--all">
          <span>🎫</span>
          <strong>{entries.length}</strong>
          <em>전체</em>
        </article>
        <article className="ticket-summary-card ticket-summary-card--win">
          <span>🏆</span>
          <strong>{totalWins}</strong>
          <em>승요</em>
        </article>
        <article className="ticket-summary-card ticket-summary-card--lose">
          <span>💪</span>
          <strong>{totalLosses}</strong>
          <em>패요</em>
        </article>
      </section>

      <section className="ticket-filter" aria-label="티켓 필터">
        <span className="ticket-filter__icon" aria-hidden="true">
          ⌯
        </span>
        {filters.map((item) => (
          <button
            className={
              filter === item.key
                ? "ticket-filter__button is-active"
                : "ticket-filter__button"
            }
            key={item.key}
            onClick={() => setFilter(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="ticketbook-list" aria-label="티켓북 목록">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <TicketCard
              entry={entry}
              game={gameById.get(entry.game_id)}
              href={`/entries/${entry.id}`}
              key={entry.id}
              variant="list"
            />
          ))
        ) : (
          <InlineState
            title="해당 티켓이 없어요."
            description="다른 필터를 선택하거나 새 직관 기록을 만들어보세요."
          />
        )}
      </section>
    </>
  );
}
