import Link from "next/link";

export function HeroSection() {
  return (
    <section className="hero-card">
      <div className="hero-card__copy">
        <span className="hero-card__eyebrow">BALLLOG</span>
        <h1>야구장의 열기를 한 장의 티켓과 일기로 남겨보세요.</h1>
        <p>
          직관의 분위기, 오늘의 감정, 그리고 팬심이 담긴 티켓 카드까지.
          Ballog는 KBO 팬의 하루를 가장 보기 좋게 기록하는 다이어리 앱입니다.
        </p>
        <div className="hero-card__actions">
          <Link className="button button--primary" href="/create">
            오늘 직관 기록하기
          </Link>
          <Link className="button button--ghost" href="/collection">
            티켓 모아보기
          </Link>
        </div>
      </div>
      <div className="hero-card__visual">
        <div className="hero-card__scoreboard">
          <span>NIGHT GAME</span>
          <strong>STADIUM MOOD</strong>
          <p>SPOTLIGHTS ON. CROWD LOUD. MEMORIES SAVED.</p>
        </div>
      </div>
    </section>
  );
}
