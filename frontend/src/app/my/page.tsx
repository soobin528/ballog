"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { KBO_TEAMS } from "@/lib/kbo";

const achievements = [
  "첫 직관 완료",
  "티켓 10장 수집",
  "승요 인증",
  "비 오는 날 직관러",
];

const recentActivities = [
  { date: "4/29", matchup: "SSG vs LG", result: "승리" },
  { date: "4/21", matchup: "두산 vs KT", result: "승리" },
  { date: "4/12", matchup: "키움 vs 삼성", result: "패배" },
];

export default function MyPage() {
  const [nickname, setNickname] = useState("야구로운 하루");
  const [favoriteTeam, setFavoriteTeam] = useState("두산 베어스");
  const [startYear, setStartYear] = useState("2021");
  const [favoritePlayer, setFavoritePlayer] = useState("정수빈");
  const [homeStadium, setHomeStadium] = useState("잠실야구장");
  const fanYears = useMemo(() => {
    const year = Number(startYear);
    const currentYear = new Date().getFullYear();

    if (Number.isNaN(year) || year > currentYear) {
      return 1;
    }

    return Math.max(currentYear - year + 1, 1);
  }, [startYear]);

  return (
    <PageShell className="page-shell--my">
      <section className="my-page" aria-labelledby="my-title">
        <article className="my-hero-card">
          <div className="my-hero-card__avatar" aria-hidden="true">
            ⚾
          </div>
          <div className="my-hero-card__profile">
            <span className="section-heading__eyebrow">팬 프로필</span>
            <h1 id="my-title">{nickname}</h1>
            <p>{favoriteTeam.replace(" 베어스", "")}과 함께한 {fanYears}년차 팬</p>
            <div className="my-badge-row" aria-label="팬 배지">
              <span>직관러</span>
              <span>승요</span>
              <span>열혈팬</span>
            </div>
          </div>
          <div className="my-team-badge">
            <span>응원 팀</span>
            <strong>{favoriteTeam}</strong>
          </div>
        </article>

        <section className="my-stat-row" aria-label="팬 요약 통계">
          <article>
            <span>총 직관 횟수</span>
            <strong>12회</strong>
          </article>
          <article>
            <span>승률</span>
            <strong>72%</strong>
          </article>
          <article>
            <span>모은 티켓 수</span>
            <strong>11장</strong>
          </article>
        </section>

        <section className="my-section-card" aria-labelledby="profile-edit-title">
          <div className="my-section-card__header">
            <span className="section-heading__eyebrow">프로필</span>
            <h2 id="profile-edit-title">나의 야구 취향</h2>
          </div>
          <form className="my-profile-form">
            <label>
              <span>닉네임</span>
              <input
                onChange={(event) => setNickname(event.target.value)}
                value={nickname}
              />
            </label>
            <label>
              <span>응원 팀</span>
              <select
                onChange={(event) => setFavoriteTeam(event.target.value)}
                value={favoriteTeam}
              >
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
                onChange={(event) => setStartYear(event.target.value)}
                value={startYear}
              />
            </label>
            <label>
              <span>최애 선수</span>
              <input
                onChange={(event) => setFavoritePlayer(event.target.value)}
                value={favoritePlayer}
              />
            </label>
            <label className="my-profile-form__wide">
              <span>주 직관 구장</span>
              <input
                onChange={(event) => setHomeStadium(event.target.value)}
                value={homeStadium}
              />
            </label>
          </form>
        </section>

        <section className="my-section-card" aria-labelledby="achievements-title">
          <div className="my-section-card__header">
            <span className="section-heading__eyebrow">ACHIEVEMENTS</span>
            <h2 id="achievements-title">나의 야구 배지</h2>
          </div>
          <div className="my-achievement-strip">
            {achievements.map((achievement) => (
              <article key={achievement}>
                <span>★</span>
                <strong>{achievement}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="my-section-card" aria-labelledby="recent-title">
          <div className="my-section-card__header">
            <span className="section-heading__eyebrow">RECENT</span>
            <h2 id="recent-title">최근 직관 기록</h2>
          </div>
          <div className="my-activity-list">
            {recentActivities.map((activity) => (
              <article key={`${activity.date}-${activity.matchup}`}>
                <span>{activity.date}</span>
                <strong>{activity.matchup}</strong>
                <em>{activity.result}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="my-action-panel" aria-label="MY 페이지 작업">
          <button className="button button--primary button--wide" type="button">
            저장하기
          </button>
          <div className="my-action-panel__secondary">
            <button className="button button--ghost" type="button">
              로그아웃
            </button>
            <button className="button button--ghost" type="button">
              데이터 초기화
            </button>
            <Link className="button button--ghost" href="/collection">
              내 티켓 보기
            </Link>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
