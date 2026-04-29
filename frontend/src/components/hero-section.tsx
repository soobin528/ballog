import Link from "next/link";

export function HeroSection() {
  return (
    <section className="hero-card hero-card--retro">
      <header className="hero-header">
        <span className="hero-header__corner hero-header__corner--left" />
        <span className="hero-header__corner hero-header__corner--right" />
        <div className="hero-header__inner">
          <strong>BALLLOG</strong>
          <p>⚾ 야구 직관 다이어리</p>
        </div>
      </header>

      <div className="hero-intro-card">
        <div className="hero-intro-card__accent" />
        <div className="hero-intro-card__copy">
          <h1>야구 직관의 추억을</h1>
          <h2>빈티지 티켓으로 간직하세요</h2>
          <p>
            경기, 응원팀, 오늘의 감정을 기록하면 나만의 직관 티켓이
            만들어져요.
          </p>
        </div>
        <div className="hero-intro-card__stamp" aria-hidden="true" />
      </div>

      <div className="hero-card__actions">
        <Link className="button button--primary" href="/create">
          오늘 직관 기록하기
        </Link>
        <Link className="button button--ghost" href="/collection">
          티켓 모아보기
        </Link>
      </div>
    </section>
  );
}
