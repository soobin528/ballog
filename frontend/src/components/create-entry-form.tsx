"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { CreateEntryPayload, Game, User } from "@/lib/api";
import { createEntry } from "@/lib/api";
import { InlineState } from "@/components/inline-state";

type CreateEntryFormProps = {
  users: User[];
  games: Game[];
  initialError?: string | null;
};

type MissionDraft = {
  title: string;
  is_completed: boolean;
};

export function CreateEntryForm({
  users,
  games,
  initialError,
}: CreateEntryFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<number | "">(users[0]?.id ?? "");
  const [gameId, setGameId] = useState<number | "">(games[0]?.id ?? "");
  const [watchedTeam, setWatchedTeam] = useState("");
  const [memo, setMemo] = useState("");
  const [missions, setMissions] = useState<MissionDraft[]>([
    { title: "응원 포인트 남기기", is_completed: true },
    { title: "기억에 남는 장면 체크", is_completed: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(initialError ?? null);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === gameId) ?? null,
    [gameId, games],
  );

  useEffect(() => {
    if (!selectedGame) {
      setWatchedTeam("");
      return;
    }

    if (
      watchedTeam !== selectedGame.home_team &&
      watchedTeam !== selectedGame.away_team
    ) {
      setWatchedTeam(selectedGame.home_team);
    }
  }, [selectedGame, watchedTeam]);

  const canSubmit = Boolean(userId && gameId && watchedTeam);

  const updateMission = (
    index: number,
    key: keyof MissionDraft,
    value: string | boolean,
  ) => {
    setMissions((current) =>
      current.map((mission, missionIndex) =>
        missionIndex === index ? { ...mission, [key]: value } : mission,
      ),
    );
  };

  const addMission = () => {
    setMissions((current) => [
      ...current,
      { title: "", is_completed: false },
    ]);
  };

  const removeMission = (index: number) => {
    setMissions((current) => current.filter((_, missionIndex) => missionIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId || !gameId || !watchedTeam) {
      setSubmitError("사용자, 경기, 응원 팀을 모두 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload: CreateEntryPayload = {
      user_id: userId,
      game_id: gameId,
      watched_team: watchedTeam,
      memo,
      missions: missions
        .filter((mission) => mission.title.trim().length > 0)
        .map((mission) => ({
          title: mission.title.trim(),
          is_completed: mission.is_completed,
        })),
    };

    try {
      const created = await createEntry(payload);
      router.push(`/entries/${created.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "기록 저장 중 오류가 발생했습니다.";
      setSubmitError(message);
      setSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-card__header">
        <span className="section-heading__eyebrow">CREATE ENTRY</span>
        <h1>오늘의 직관을 기록해보세요.</h1>
        <p>간단한 메모와 미션 체크만 남기면 다이어리와 티켓이 자동으로 만들어집니다.</p>
      </div>

      {submitError ? (
        <InlineState
          tone="error"
          title="저장에 실패했어요."
          description={submitError}
        />
      ) : null}

      <div className="form-grid">
        <label className="field">
          <span>사용자</span>
          <select
            value={userId}
            onChange={(event) => setUserId(Number(event.target.value))}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nickname} {user.favorite_team ? `· ${user.favorite_team}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>경기 선택</span>
          <select
            value={gameId}
            onChange={(event) => setGameId(Number(event.target.value))}
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.home_team} vs {game.away_team}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>응원한 팀</span>
          <select
            value={watchedTeam}
            onChange={(event) => setWatchedTeam(event.target.value)}
          >
            {selectedGame ? (
              <>
                <option value={selectedGame.home_team}>{selectedGame.home_team}</option>
                <option value={selectedGame.away_team}>{selectedGame.away_team}</option>
              </>
            ) : (
              <option value="">경기를 먼저 선택해주세요</option>
            )}
          </select>
        </label>

        <label className="field field--full">
          <span>오늘의 메모</span>
          <textarea
            rows={5}
            placeholder="예: 9회말 응원가를 다 같이 부르던 순간이 최고였다."
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>
      </div>

      <div className="mission-block">
        <div className="mission-block__header">
          <div>
            <strong>오늘의 미션 체크</strong>
            <p>기억하고 싶은 포인트를 체크리스트로 남겨보세요.</p>
          </div>
          <button
            className="button button--ghost"
            type="button"
            onClick={addMission}
          >
            미션 추가
          </button>
        </div>

        <div className="mission-list">
          {missions.map((mission, index) => (
            <div className="mission-item" key={`${mission.title}-${index}`}>
              <input
                checked={mission.is_completed}
                type="checkbox"
                onChange={(event) =>
                  updateMission(index, "is_completed", event.target.checked)
                }
              />
              <input
                className="mission-item__input"
                placeholder="예: 응원가 따라 부르기"
                type="text"
                value={mission.title}
                onChange={(event) =>
                  updateMission(index, "title", event.target.value)
                }
              />
              <button
                className="mission-item__remove"
                type="button"
                onClick={() => removeMission(index)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        className="button button--primary button--wide"
        disabled={!canSubmit || submitting}
        type="submit"
      >
        {submitting ? "기록 저장 중..." : "티켓과 일기 만들기"}
      </button>
    </form>
  );
}
