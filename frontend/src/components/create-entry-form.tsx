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

const PRESET_MISSIONS = [
  "응원 포인트 남기기",
  "기억에 남는 장면 체크",
  "오늘의 MVP 떠올리기",
  "경기장 음식 기록하기",
  "좌석 시야 기록하기",
] as const;

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
  const selectedGameDate = selectedGame
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(selectedGame.game_date))
    : "경기를 선택하면 날짜가 보여요";
  const selectedStadium = selectedGame?.stadium ?? "경기장 정보 없음";
  const homeTeam = selectedGame?.home_team ?? "선택";
  const awayTeam = selectedGame?.away_team ?? "선택";
  const homeScore = selectedGame?.home_score ?? 0;
  const awayScore = selectedGame?.away_score ?? 0;

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

  const addPresetMission = (title: string) => {
    setMissions((current) => {
      if (current.some((mission) => mission.title.trim() === title)) {
        return current;
      }

      return [...current, { title, is_completed: false }];
    });
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
    <form className="form-card create-form" onSubmit={handleSubmit}>
      <div className="create-form__header">
        <span className="create-form__eyebrow">GAME RECORD</span>
        <h1>경기 정보를 입력하세요</h1>
        <p>차근차근 적으면 직관 티켓이 완성돼요.</p>
        <button
          aria-label="닫기"
          className="create-form__close"
          type="button"
          onClick={() => router.back()}
        >
          ×
        </button>
      </div>

      <div className="create-form__body">
        {submitError ? (
          <InlineState
            tone="error"
            title="저장에 실패했어요."
            description={submitError}
          />
        ) : null}

        <section className="create-panel create-panel--step-one create-panel--compact">
          <div className="create-step-card__header">
            <span className="create-step-card__eyebrow">STEP 1</span>
            <strong>기록자와 경기 선택</strong>
          </div>

          <div className="create-step-card__grid">
            <label className="field">
              <span className="create-label">👤 기록자</span>
              <select
                className="create-input"
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
              <span className="create-label">🗂️ 경기 선택</span>
              <select
                className="create-input"
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
          </div>
        </section>

        <section className="create-panel create-panel--field">
          <div className="create-step-card__header">
            <span className="create-label">📅 경기 날짜</span>
          </div>
          <div className="create-input create-input--readonly">{selectedGameDate}</div>
        </section>

        <section className="create-panel create-panel--field">
          <div className="create-step-card__header">
            <span className="create-label">🏟️ 경기장</span>
          </div>
          <div className="create-input create-input--readonly">{selectedStadium}</div>
        </section>

        <div className="create-team-grid">
          <section className="create-panel create-panel--home">
            <div className="create-step-card__header">
              <span className="create-label">🏠 홈팀</span>
            </div>
            <div className="create-input create-input--readonly">{homeTeam}</div>
          </section>

          <section className="create-panel create-panel--away">
            <div className="create-step-card__header">
              <span className="create-label">✈️ 원정팀</span>
            </div>
            <div className="create-input create-input--readonly">{awayTeam}</div>
          </section>
        </div>

        <section className="create-panel create-panel--score">
          <div className="create-step-card__header">
            <span className="create-label">🎯 최종 점수</span>
          </div>

          <div className="create-score-grid">
            <div className="create-score-col">
              <span className="create-score-col__label">홈팀</span>
              <div className="create-input create-input--readonly create-input--score">
                {homeScore}
              </div>
            </div>
            <div className="create-score-col">
              <span className="create-score-col__label">원정팀</span>
              <div className="create-input create-input--readonly create-input--score">
                {awayScore}
              </div>
            </div>
          </div>
        </section>

        <section className="create-panel create-panel--team">
          <div className="create-step-card__header">
            <span className="create-step-card__eyebrow">STEP 2</span>
            <strong>내가 응원한 팀</strong>
          </div>

          <label className="field">
            <span className="create-label">❤️ 응원 팀 선택</span>
            <select
              className="create-input"
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
        </section>

        <section className="create-panel create-panel--utility-row">
          <div className="create-utility-grid">
            <div className="create-utility-card">
              <span className="create-label">🌤️ 날씨</span>
              <div className="create-utility-placeholder">선택</div>
            </div>
            <div className="create-utility-card">
              <span className="create-label">💺 좌석</span>
              <div className="create-utility-placeholder">예: 3루 207</div>
            </div>
          </div>
        </section>

        <section className="create-panel">
          <div className="create-step-card__header">
            <span className="create-step-card__eyebrow">동행인</span>
            <strong>동행인</strong>
          </div>

          <div className="create-utility-placeholder create-utility-placeholder--wide">
            예: 친구, 가족, 혼자
          </div>
        </section>

        <section className="create-panel create-panel--mission">
          <div className="create-step-card__header">
            <span className="create-step-card__eyebrow">STEP 3</span>
            <strong>오늘의 미션</strong>
          </div>

          <div className="create-mission-presets">
            {PRESET_MISSIONS.map((mission) => (
              <button
                className="create-mission-chip"
                key={mission}
                type="button"
                onClick={() => addPresetMission(mission)}
              >
                {mission}
              </button>
            ))}
            <button
              className="create-mission-chip create-mission-chip--ghost"
              type="button"
              onClick={addMission}
            >
              직접 추가
            </button>
          </div>

          <div className="create-mission-list">
            {missions.map((mission, index) => (
              <div className="create-mission-item" key={`${mission.title}-${index}`}>
                <input
                  checked={mission.is_completed}
                  className="create-mission-item__check"
                  type="checkbox"
                  onChange={(event) =>
                    updateMission(index, "is_completed", event.target.checked)
                  }
                />
                <input
                  className="create-input create-mission-item__input"
                  placeholder="예: 응원가 따라 부르기"
                  type="text"
                  value={mission.title}
                  onChange={(event) =>
                    updateMission(index, "title", event.target.value)
                  }
                />
                <button
                  className="create-mission-item__remove"
                  type="button"
                  onClick={() => removeMission(index)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="create-panel create-panel--memo">
          <div className="create-step-card__header">
            <span className="create-step-card__eyebrow">오늘의 기록</span>
            <strong>오늘의 메모</strong>
          </div>

          <label className="field">
            <span className="create-label">📝 인상 깊었던 순간</span>
            <textarea
              className="create-input create-textarea"
              rows={5}
              placeholder="인상 깊었던 순간, 응원 분위기 등을 자유롭게 적어주세요."
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </label>
        </section>

        <div className="create-actions">
          <button
            className="button button--ghost create-submit create-submit--cancel"
            type="button"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            className="button button--primary create-submit"
            disabled={!canSubmit || submitting}
            type="submit"
          >
            {submitting ? "기록 저장 중..." : "🎟️ 티켓 생성"}
          </button>
        </div>
      </div>
    </form>
  );
}
