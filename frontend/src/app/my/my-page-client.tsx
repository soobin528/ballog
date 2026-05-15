"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Entry, User } from "@/lib/api";
import { updateUser } from "@/lib/api";
import { KBO_STADIUMS, KBO_TEAMS, normalizeStadiumName, normalizeTeamName } from "@/lib/kbo";

type MyPageClientProps = {
  entries: Entry[];
  initialUser: User;
};

function getFanYears(startYear: string) {
  const year = Number(startYear);
  const currentYear = new Date().getFullYear();

  if (Number.isNaN(year) || year > currentYear) {
    return 1;
  }

  return Math.max(currentYear - year + 1, 1);
}

function getSavedProfileSummary(user: User) {
  const favoriteTeam = user.favorite_team
    ? normalizeTeamName(user.favorite_team)
    : null;
  const fanYears = user.fan_since_year
    ? getFanYears(String(user.fan_since_year))
    : null;

  if (favoriteTeam && fanYears) {
    return `${favoriteTeam}과 함께한 ${fanYears}년차 팬`;
  }

  if (favoriteTeam) {
    return `${favoriteTeam} 팬`;
  }

  return "프로필 정보를 입력해주세요";
}

function getShortDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function MyPageClient({ entries, initialUser }: MyPageClientProps) {
  const [user, setUser] = useState(initialUser);
  const [nickname, setNickname] = useState(user.nickname);
  const [favoriteTeam, setFavoriteTeam] = useState(
    user.favorite_team ? normalizeTeamName(user.favorite_team) : "",
  );
  const [startYear, setStartYear] = useState(
    user.fan_since_year ? String(user.fan_since_year) : "",
  );
  const [favoritePlayer, setFavoritePlayer] = useState(user.favorite_player ?? "");
  const [homeStadium, setHomeStadium] = useState(
    normalizeStadiumName(user.home_stadium),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userEntries = useMemo(
    () => entries.filter((entry) => entry.user_id === user.id),
    [entries, user.id],
  );
  const winCount = userEntries.filter((entry) => entry.is_win === true).length;
  const winRate =
    userEntries.length > 0 ? Math.round((winCount / userEntries.length) * 100) : 0;
  const savedFavoriteTeam = user.favorite_team
    ? normalizeTeamName(user.favorite_team)
    : "선택해주세요";
  const savedProfileSummary = getSavedProfileSummary(user);
  const recentActivities = userEntries.slice(-3).reverse();

  const handleDraftChange = (callback: () => void) => {
    setMessage(null);
    callback();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedUser = await updateUser(user.id, {
        nickname: nickname.trim(),
        favorite_team: favoriteTeam || null,
        fan_since_year: Number(startYear) || null,
        favorite_player: favoritePlayer.trim() || null,
        home_stadium: homeStadium || null,
      });
      setUser(updatedUser);
      setMessage("프로필이 저장됐어요.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "프로필 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="my-page" aria-labelledby="my-title">
      <article className="my-hero-card">
        <div className="my-hero-card__avatar" aria-hidden="true">
          ⚾
        </div>
        <div className="my-hero-card__profile">
          <span className="section-heading__eyebrow">팬 프로필</span>
          <h1 id="my-title">{user.nickname}</h1>
          <p>{savedProfileSummary}</p>
          <div className="my-badge-row" aria-label="팬 배지">
            <span>직관러</span>
            {winCount > 0 ? <span>승리 기록 보유</span> : null}
            {userEntries.length >= 10 ? <span>티켓 10장</span> : null}
          </div>
        </div>
        <div className="my-team-badge">
          <span>응원 팀</span>
          <strong>{savedFavoriteTeam}</strong>
        </div>
      </article>

      <section className="my-stat-row" aria-label="팬 요약 통계">
        <article>
          <span>총 직관 횟수</span>
          <strong>{userEntries.length}회</strong>
        </article>
        <article>
          <span>승률</span>
          <strong>{winRate}%</strong>
        </article>
        <article>
          <span>모은 티켓 수</span>
          <strong>{userEntries.length}장</strong>
        </article>
      </section>

      <section className="my-section-card" aria-labelledby="profile-edit-title">
        <div className="my-section-card__header">
          <span className="section-heading__eyebrow">프로필</span>
          <h2 id="profile-edit-title">나의 야구 취향</h2>
        </div>
        <form className="my-profile-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>닉네임</span>
            <input
              onChange={(event) =>
                handleDraftChange(() => setNickname(event.target.value))
              }
              value={nickname}
            />
          </label>
          <label>
            <span>응원 팀</span>
            <select
              onChange={(event) =>
                handleDraftChange(() => setFavoriteTeam(event.target.value))
              }
              value={favoriteTeam}
            >
              <option value="">선택해주세요</option>
              {KBO_TEAMS.map((team) => (
                <option key={team.name} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>야구팬 시작 연도</span>
            <input
              inputMode="numeric"
              onChange={(event) =>
                handleDraftChange(() => setStartYear(event.target.value))
              }
              placeholder="예: 2021"
              value={startYear}
            />
          </label>
          <label>
            <span>최애 선수</span>
            <input
              onChange={(event) =>
                handleDraftChange(() => setFavoritePlayer(event.target.value))
              }
              placeholder="예: 정수빈"
              value={favoritePlayer}
            />
          </label>
          <label className="my-profile-form__wide">
            <span>주 직관 구장</span>
            <select
              onChange={(event) =>
                handleDraftChange(() => setHomeStadium(event.target.value))
              }
              value={homeStadium}
            >
              <option value="">선택해주세요</option>
              {KBO_STADIUMS.map((stadium) => (
                <option key={stadium} value={stadium}>
                  {stadium}
                </option>
              ))}
            </select>
          </label>
        </form>
        {message ? <p className="my-form-message">{message}</p> : null}
        {error ? <p className="my-form-message my-form-message--error">{error}</p> : null}
      </section>

      <section className="my-section-card" aria-labelledby="recent-title">
        <div className="my-section-card__header">
          <span className="section-heading__eyebrow">최근</span>
          <h2 id="recent-title">최근 직관 기록</h2>
        </div>
        <div className="my-activity-list">
          {recentActivities.length > 0 ? (
            recentActivities.map((entry) => (
              <Link href={`/entries/${entry.id}`} key={entry.id}>
                <span>{getShortDate(entry.created_at)}</span>
                <strong>{entry.watched_team} 직관</strong>
                <em>{entry.is_win === true ? "승리" : entry.is_win === false ? "패배" : "기록"}</em>
              </Link>
            ))
          ) : (
            <p className="my-form-message">아직 직관 기록이 없어요.</p>
          )}
        </div>
      </section>

      <section className="my-action-panel" aria-label="마이페이지 작업">
        <button
          className="button button--primary button--wide"
          disabled={saving}
          type="button"
          onClick={handleSave}
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
        <div className="my-action-panel__secondary">
          <Link className="button button--ghost" href="/create">
            기록 추가
          </Link>
          <Link className="button button--ghost" href="/diary">
            다이어리
          </Link>
          <Link className="button button--ghost" href="/collection">
            티켓 보기
          </Link>
        </div>
      </section>
    </section>
  );
}
