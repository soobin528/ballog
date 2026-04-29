export type KboTeam = {
  name: string;
  shortName: string;
  stadium: string;
  primary: string;
  secondary: string;
};

export const KBO_TEAMS: KboTeam[] = [
  {
    name: "LG 트윈스",
    shortName: "LG",
    stadium: "잠실야구장",
    primary: "#C30452",
    secondary: "#111111",
  },
  {
    name: "두산 베어스",
    shortName: "두산",
    stadium: "잠실야구장",
    primary: "#131230",
    secondary: "#FFFFFF",
  },
  {
    name: "SSG 랜더스",
    shortName: "SSG",
    stadium: "인천 SSG 랜더스필드",
    primary: "#CE0E2D",
    secondary: "#111111",
  },
  {
    name: "키움 히어로즈",
    shortName: "키움",
    stadium: "고척스카이돔",
    primary: "#6F263D",
    secondary: "#F5D0A9",
  },
  {
    name: "KT 위즈",
    shortName: "KT",
    stadium: "수원 KT 위즈파크",
    primary: "#000000",
    secondary: "#ED1C24",
  },
  {
    name: "삼성 라이온즈",
    shortName: "삼성",
    stadium: "대구 삼성라이온즈파크",
    primary: "#074CA1",
    secondary: "#C0C0C0",
  },
  {
    name: "롯데 자이언츠",
    shortName: "롯데",
    stadium: "부산 사직야구장",
    primary: "#002955",
    secondary: "#D00F31",
  },
  {
    name: "KIA 타이거즈",
    shortName: "KIA",
    stadium: "광주 KIA 챔피언스필드",
    primary: "#EA0029",
    secondary: "#111111",
  },
  {
    name: "한화 이글스",
    shortName: "한화",
    stadium: "대전 한화생명 볼파크",
    primary: "#F37321",
    secondary: "#111111",
  },
  {
    name: "NC 다이노스",
    shortName: "NC",
    stadium: "창원 NC 파크",
    primary: "#315288",
    secondary: "#C7A45D",
  },
];

export const KBO_TEAM_NAMES = KBO_TEAMS.map((team) => team.name);

export const KBO_STADIUMS = Array.from(
  new Map(KBO_TEAMS.map((team) => [team.stadium, team.stadium])).values(),
);

const TEAM_ALIASES: Record<string, string> = {
  "Doosan Bears": "두산 베어스",
  "LG Twins": "LG 트윈스",
  "SSG Landers": "SSG 랜더스",
  "Kiwoom Heroes": "키움 히어로즈",
  "KT Wiz": "KT 위즈",
  "Samsung Lions": "삼성 라이온즈",
  "Lotte Giants": "롯데 자이언츠",
  "KIA Tigers": "KIA 타이거즈",
  "Hanwha Eagles": "한화 이글스",
  "NC Dinos": "NC 다이노스",
};

const STADIUM_ALIASES: Record<string, string> = {
  "Jamsil Baseball Stadium": "잠실야구장",
  "Incheon SSG Landers Field": "인천 SSG 랜더스필드",
  "Gocheok Sky Dome": "고척스카이돔",
  "Suwon KT Wiz Park": "수원 KT 위즈파크",
  "Daegu Samsung Lions Park": "대구 삼성라이온즈파크",
  "Busan Sajik Baseball Stadium": "부산 사직야구장",
  "Gwangju-Kia Champions Field": "광주 KIA 챔피언스필드",
  "Daejeon Hanwha Life Eagles Park": "대전 한화생명 이글스파크",
  "Changwon NC Park": "창원 NC 파크",
};

export function normalizeTeamName(teamName: string) {
  return TEAM_ALIASES[teamName] ?? teamName;
}

export function normalizeStadiumName(stadium: string | null | undefined) {
  if (!stadium) {
    return "";
  }

  return STADIUM_ALIASES[stadium] ?? stadium;
}

export function getTeamByStadium(stadium: string) {
  return KBO_TEAMS.find((team) => team.stadium === stadium) ?? null;
}

export function getTeamColors(teamName: string) {
  const normalizedTeamName = normalizeTeamName(teamName);
  const team = KBO_TEAMS.find((item) => item.name === normalizedTeamName);

  return team
    ? { primary: team.primary, secondary: team.secondary }
    : { primary: "#8E0012", secondary: "#F2C230" };
}
