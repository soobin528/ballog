from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent.parent
TICKETS_DIR = BASE_DIR / "static" / "tickets"


def _is_win(entry, game):
    if game.home_score is None or game.away_score is None:
        return None

    if entry.watched_team == game.home_team:
        return game.home_score > game.away_score

    if entry.watched_team == game.away_team:
        return game.away_score > game.home_score

    return None


def _load_font(size: int):
    font_paths = [
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size=size)
        except OSError:
            continue

    return ImageFont.load_default()


def _truncate_text(text: str | None, limit: int = 28) -> str:
    if not text:
        return "-"

    cleaned = " ".join(text.split())
    if len(cleaned) <= limit:
        return cleaned

    return f"{cleaned[: limit - 3]}..."


def generate_ticket(entry, game) -> str:
    TICKETS_DIR.mkdir(parents=True, exist_ok=True)

    is_win = _is_win(entry, game)
    if is_win is True:
        background = "#F6B73C"
        accent = "#8A4B00"
        symbol = "★"
    elif is_win is False:
        background = "#5C6B8A"
        accent = "#E8EEF9"
        symbol = "●"
    else:
        background = "#A0B7C8"
        accent = "#17324D"
        symbol = "◇"

    image = Image.new("RGB", (420, 220), color=background)
    draw = ImageDraw.Draw(image)

    title_font = _load_font(24)
    body_font = _load_font(16)
    small_font = _load_font(14)

    draw.rounded_rectangle((12, 12, 408, 208), radius=18, outline=accent, width=3)
    draw.line((210, 20, 210, 200), fill=accent, width=2)

    draw.text((28, 26), f"{symbol} BALLLOG TICKET", fill=accent, font=title_font)
    draw.text((28, 70), game.venue or "Stadium TBD", fill=accent, font=body_font)
    draw.text((28, 100), f"{game.home_team} vs {game.away_team}", fill=accent, font=body_font)

    if game.home_score is not None and game.away_score is not None:
        score_text = f"SCORE  {game.home_score} : {game.away_score}"
    else:
        score_text = "SCORE  TBD"
    draw.text((28, 130), score_text, fill=accent, font=body_font)

    draw.text((28, 165), _truncate_text(entry.memo), fill=accent, font=small_font)
    draw.text((240, 48), f"ENTRY #{entry.id}", fill=accent, font=body_font)
    draw.text((240, 90), entry.watched_team, fill=accent, font=body_font)
    draw.text((240, 130), "SEE YOU AGAIN", fill=accent, font=small_font)

    filename = f"ticket_{entry.id}.png"
    image.save(TICKETS_DIR / filename)

    return f"/static/tickets/{filename}"
