export type User = {
  id: number;
  email: string;
  nickname: string;
  favorite_team: string | null;
  created_at: string;
  updated_at: string;
};

export type Game = {
  id: number;
  game_date: string;
  stadium: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type EntryMission = {
  id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Entry = {
  id: number;
  user_id: number;
  game_id: number;
  watched_team: string;
  memo: string | null;
  diary_text: string | null;
  ticket_image_url: string | null;
  is_win: boolean | null;
  mission_success_count: number;
  missions: EntryMission[];
  created_at: string;
  updated_at: string;
};

export type CreateEntryPayload = {
  user_id: number;
  game_id: number;
  watched_team: string;
  memo: string;
  missions: Array<{
    title: string;
    is_completed: boolean;
  }>;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

export function getAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getApiBaseUrl()}${path}`;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "요청을 처리하지 못했습니다.";

    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) {
        message = data.detail;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchUsers() {
  return request<User[]>("/users");
}

export async function fetchGames() {
  return request<Game[]>("/games");
}

export async function fetchEntries() {
  return request<Entry[]>("/entries");
}

export async function fetchEntry(entryId: string | number) {
  return request<Entry>(`/entries/${entryId}`);
}

export async function fetchGame(gameId: string | number) {
  return request<Game>(`/games/${gameId}`);
}

export async function createEntry(payload: CreateEntryPayload) {
  return request<Entry>("/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { ApiError };
