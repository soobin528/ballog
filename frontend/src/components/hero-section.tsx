import Link from "next/link";

export function HeroSection() {
  const stadiumNav = [
    { label: "다이어리", href: "/diary", position: "first", meta: "캘린더" },
    { label: "기록", href: "/create", position: "home", meta: "오늘 직관" },
    { label: "티켓", href: "/collection", position: "third", meta: "모음집" },
    { label: "MY", href: "/my", position: "second", meta: "내 응원" },
  ];

  return (
    <section className="home-stadium-hero" aria-labelledby="home-stadium-title">
      <header className="hero-header">
        <span className="hero-header__corner hero-header__corner--left" />
        <span className="hero-header__corner hero-header__corner--right" />
        <div className="hero-header__inner">
          <strong>BALLOG</strong>
          <p>야구 직관 다이어리</p>
        </div>
      </header>

      <div className="pixel-ballpark" aria-label="메인 메뉴">
        <div className="pixel-ballpark__skyline" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="pixel-field">
          <div className="pixel-field__grass" />
          <div className="pixel-field__infield" />
          <div className="pixel-field__diamond" />
          <div className="pixel-field__mound">
            <span>B</span>
          </div>

          {stadiumNav.map((item) => (
            <Link
              className={`pixel-base pixel-base--${item.position}`}
              href={item.href}
              key={item.label}
            >
              <span>{item.label}</span>
              <em>{item.meta}</em>
            </Link>
          ))}
        </div>

        <div className="pixel-scoreboard">
          <span className="pixel-scoreboard__eyebrow">PLAY BALL</span>
          <h1 id="home-stadium-title">오늘의 직관을 다이어리로</h1>
          <p>베이스를 눌러 기록하고, 읽고, 모아봐요.</p>
        </div>
      </div>
    </section>
  );
}
