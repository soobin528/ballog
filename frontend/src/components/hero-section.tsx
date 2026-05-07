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
          <h1>오늘의 직관을</h1>
          <h2>다이어리로 남겨요</h2>
          <p>
            경기보다 오래 남는 장면과 감정을 먼저 기록하고, 티켓은 자연스럽게 따라오게요.
          </p>
        </div>
        <div className="hero-intro-card__stamp" aria-hidden="true" />
      </div>

      <div className="hero-card__actions">
        <Link className="button button--primary" href="/create">
          오늘 직관 기록하기
        </Link>
        <Link className="button button--ghost" href="/diary">
          다이어리 보기
        </Link>
      </div>
    </section>
  );
}
