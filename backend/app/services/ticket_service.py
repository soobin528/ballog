from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


BASE_DIR = Path(__file__).resolve().parent.parent
TICKETS_DIR = BASE_DIR / "static" / "tickets"

FONT_CANDIDATES = [
    Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    Path("/System/Library/Fonts/Supplemental/Helvetica.ttc"),
    Path("/Library/Fonts/Arial Unicode.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
]

TEAM_COLORS = {
    "Doosan Bears": "#131230",
    "LG Twins": "#C30452",
    "SSG Landers": "#C8102E",
    "Kiwoom Heroes": "#570514",
    "KT Wiz": "#111111",
    "KIA Tigers": "#EA0029",
    "NC Dinos": "#315288",
    "Samsung Lions": "#074CA1",
    "Lotte Giants": "#041E42",
    "Hanwha Eagles": "#F37321",
    "두산 베어스": "#131230",
    "LG 트윈스": "#C30452",
    "SSG 랜더스": "#C8102E",
    "키움 히어로즈": "#570514",
    "KT 위즈": "#111111",
    "KIA 타이거즈": "#EA0029",
    "NC 다이노스": "#315288",
    "삼성 라이온즈": "#074CA1",
    "롯데 자이언츠": "#041E42",
    "한화 이글스": "#F37321",
}

TEAM_BADGES = {
    "Doosan Bears": "D",
    "LG Twins": "LG",
    "SSG Landers": "SSG",
    "Kiwoom Heroes": "K",
    "KT Wiz": "KT",
    "KIA Tigers": "KIA",
    "NC Dinos": "NC",
    "Samsung Lions": "S",
    "Lotte Giants": "L",
    "Hanwha Eagles": "H",
    "두산 베어스": "두산",
    "LG 트윈스": "LG",
    "SSG 랜더스": "SSG",
    "키움 히어로즈": "키움",
    "KT 위즈": "KT",
    "KIA 타이거즈": "KIA",
    "NC 다이노스": "NC",
    "삼성 라이온즈": "삼성",
    "롯데 자이언츠": "롯데",
    "한화 이글스": "한화",
}


def _is_win(entry, game):
    if game.home_score is None or game.away_score is None:
        return None

    if entry.watched_team == game.home_team:
        return game.home_score > game.away_score

    if entry.watched_team == game.away_team:
        return game.away_score > game.home_score

    return None


def _load_font(size: int):
    for font_path in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(str(font_path), size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _truncate_text(text: str | None, limit: int = 30) -> str:
    if not text:
        return "-"

    cleaned = " ".join(text.split())
    if len(cleaned) <= limit:
        return cleaned
    return f"{cleaned[: limit - 3]}..."


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))


def _mix_color(color: str, target: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    base = _hex_to_rgb(color)
    return tuple(int(base[i] * (1 - ratio) + target[i] * ratio) for i in range(3))


def _rounded_box(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def _fit_text(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int = 14):
    size = start_size
    while size >= min_size:
        font = _load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        if text_width <= max_width:
            return text, font
        size -= 1

    font = _load_font(min_size)
    truncated = text
    while len(truncated) > 3:
        truncated = truncated[:-1]
        candidate = truncated + "..."
        bbox = draw.textbbox((0, 0), candidate, font=font)
        text_width = bbox[2] - bbox[0]
        if text_width <= max_width:
            return candidate, font

    return "...", font


def generate_ticket(entry, game) -> str:
    TICKETS_DIR.mkdir(parents=True, exist_ok=True)

    watched_team = getattr(entry, "watched_team", "") or "UNKNOWN"
    bg_hex = TEAM_COLORS.get(watched_team, "#1E1E2F")
    bg_color = _hex_to_rgb(bg_hex)

    card_bg = _mix_color(bg_hex, (255, 255, 255), 0.10)
    panel_bg = _mix_color(bg_hex, (255, 255, 255), 0.16)
    line_color = _mix_color(bg_hex, (255, 255, 255), 0.38)
    light_text = (245, 245, 245)
    dim_text = _mix_color(bg_hex, (255, 255, 255), 0.52)

    win_state = _is_win(entry, game)
    if win_state is True:
        badge_text = "WIN"
        badge_fill = (255, 212, 59)
        accent_text = (35, 35, 35)
    elif win_state is False:
        badge_text = "LOSE"
        badge_fill = (150, 150, 150)
        accent_text = (20, 20, 20)
    else:
        badge_text = "READY"
        badge_fill = (120, 180, 255)
        accent_text = (20, 20, 20)

    width, height = 900, 460
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    outer_margin = 24
    card_box = (outer_margin, outer_margin, width - outer_margin, height - outer_margin)
    _rounded_box(
        draw,
        card_box,
        radius=34,
        fill=card_bg,
        outline=line_color,
        width=4,
    )

    header_h = 78
    header_box = (
        card_box[0],
        card_box[1],
        card_box[2],
        card_box[1] + header_h,
    )
    _rounded_box(draw, header_box, radius=34, fill=bg_color)
    draw.rectangle(
        (header_box[0], header_box[3] - 20, header_box[2], header_box[3]),
        fill=bg_color,
    )

    title_font = _load_font(34)
    section_font = _load_font(20)
    info_font = _load_font(28)
    small_font = _load_font(18)
    team_font = _load_font(30)
    badge_font = _load_font(26)
    entry_font = _load_font(22)

    draw.text((58, 42), "BALLLOG TICKET", font=title_font, fill=light_text)

    left_x = 52
    top_y = 122
    left_w = 490
    left_box = (
        left_x,
        top_y,
        left_x + left_w,
        height - 70,
    )
    _rounded_box(draw, left_box, radius=24, fill=panel_bg, outline=line_color, width=2)

    stadium = getattr(game, "venue", None) or getattr(game, "stadium", None) or "-"
    matchup = f"{game.home_team} vs {game.away_team}"

    if game.home_score is not None and game.away_score is not None:
        score = f"SCORE  {game.home_score} : {game.away_score}"
    else:
        score = "SCORE  -"

    memo = _truncate_text(getattr(entry, "memo", ""), 34)

    draw.text((78, 148), "STADIUM", font=section_font, fill=dim_text)
    stadium_text, stadium_font = _fit_text(draw, stadium, 430, 28)
    draw.text((78, 176), stadium_text, font=stadium_font, fill=light_text)

    draw.text((78, 228), "MATCH", font=section_font, fill=dim_text)
    matchup_text, matchup_font = _fit_text(draw, matchup, 430, 26)
    draw.text((78, 256), matchup_text, font=matchup_font, fill=light_text)

    draw.text((78, 308), score, font=info_font, fill=light_text)

    draw.line((78, 352, 490, 352), fill=line_color, width=2)

    draw.text((78, 372), "MEMO", font=section_font, fill=dim_text)
    memo_text, memo_font = _fit_text(draw, memo, 430, 24, 16)
    draw.text((78, 400), memo_text, font=memo_font, fill=light_text)

    right_box = (580, 122, 830, 390)
    _rounded_box(draw, right_box, radius=24, fill=panel_bg, outline=line_color, width=2)

    badge_box = (650, 152, 760, 262)
    _rounded_box(draw, badge_box, radius=18, fill=bg_color, outline=light_text, width=4)

    badge_text_value = TEAM_BADGES.get(watched_team, watched_team[:2].upper())
    badge_inner_text, badge_team_font = _fit_text(draw, badge_text_value, 80, 28, 16)
    badge_bbox = draw.textbbox((0, 0), badge_inner_text, font=badge_team_font)
    badge_w = badge_bbox[2] - badge_bbox[0]
    badge_h = badge_bbox[3] - badge_bbox[1]
    draw.text(
        (
            (badge_box[0] + badge_box[2] - badge_w) / 2,
            (badge_box[1] + badge_box[3] - badge_h) / 2 - 4,
        ),
        badge_inner_text,
        font=badge_team_font,
        fill=light_text,
    )

    team_text, fitted_team_font = _fit_text(draw, watched_team, 210, 28, 15)
    draw.text((604, 290), team_text, font=fitted_team_font, fill=light_text)

    entry_label = f"ENTRY #{entry.id}"
    draw.text((604, 332), entry_label, font=entry_font, fill=dim_text)

    badge_pill = (650, 368, 790, 418)
    _rounded_box(draw, badge_pill, radius=22, fill=badge_fill, outline=None, width=1)

    badge_bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
    badge_w = badge_bbox[2] - badge_bbox[0]
    badge_h = badge_bbox[3] - badge_bbox[1]
    draw.text(
        (
            (badge_pill[0] + badge_pill[2] - badge_w) / 2,
            (badge_pill[1] + badge_pill[3] - badge_h) / 2 - 2,
        ),
        badge_text,
        font=badge_font,
        fill=accent_text,
    )

    # 절취선 느낌
    divider_x = 548
    draw.line((divider_x, 120, divider_x, 392), fill=line_color, width=3)
    for y in range(128, 390, 24):
        draw.ellipse((divider_x - 7, y, divider_x + 7, y + 14), fill=bg_color)

    filename = f"ticket_{entry.id}.png"
    file_path = TICKETS_DIR / filename
    img.save(file_path)

    return f"/static/tickets/{filename}"