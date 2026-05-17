# Ballog API 명세서

## 1. 개요

Ballog는 KBO 직관 기록을 저장하고, 다이어리와 티켓 이미지로 다시 보여주는 서비스입니다. 백엔드는 FastAPI 기반으로 사용자 프로필, 경기 일정, 직관 기록 API를 제공합니다.

Base URL 예시:

```text
http://127.0.0.1:8000
```

Swagger 문서:

```text
http://127.0.0.1:8000/docs
```

인증:

- 현재 버전은 로그인/회원가입 없이 데모 사용자 기반으로 동작합니다.
- 직관 기록은 `user_id`로 사용자와 연결합니다.

## 2. API 목록

### Users

- `POST /users`
- `GET /users`
- `GET /users/{user_id}`
- `PATCH /users/{user_id}`

### Games

- `POST /games`
- `GET /games`
- `GET /games/{game_id}`
- `PATCH /games/{game_id}`

### Entries

- `POST /entries`
- `GET /entries`
- `GET /entries/{entry_id}`

## 3. 공통 에러

| Status | 의미 | 예시 |
|---|---|---|
| 400 | 도메인 규칙 위반 | 같은 팀 경기 생성, 음수 점수, 빈 닉네임 |
| 404 | 대상 리소스 없음 | 없는 user_id, game_id, entry_id |
| 422 | 요청 스키마 검증 실패 | 필수 필드 누락, 날짜 형식 오류 |
| 500 | 서버 내부 오류 | DB 연결 실패 등 |

## 4. Users API

### 4.1 사용자 생성

`POST /users`

Request Body:

```json
{
  "email": "fan@ballog.com",
  "nickname": "두산칸",
  "favorite_team": "두산 베어스"
}
```

Response:

```json
{
  "id": 1,
  "email": "fan@ballog.com",
  "nickname": "두산칸",
  "favorite_team": "두산 베어스",
  "fan_since_year": null,
  "favorite_player": null,
  "home_stadium": null,
  "created_at": "2026-05-15T11:00:00",
  "updated_at": "2026-05-15T11:00:00"
}
```

처리 규칙:

- `email`, `nickname`은 앞뒤 공백을 제거합니다.
- 빈 `email`, 빈 `nickname`은 `400`으로 거절합니다.
- 중복 이메일 또는 중복 닉네임은 `400`으로 거절합니다.

### 4.2 사용자 목록 조회

`GET /users`

Response:

```json
[
  {
    "id": 1,
    "email": "fan@ballog.com",
    "nickname": "두산칸",
    "favorite_team": "두산 베어스",
    "fan_since_year": 2021,
    "favorite_player": "정수빈",
    "home_stadium": "잠실야구장",
    "created_at": "2026-05-15T11:00:00",
    "updated_at": "2026-05-15T11:00:00"
  }
]
```

### 4.3 사용자 단건 조회

`GET /users/{user_id}`

에러:

- 사용자가 없으면 `404 User not found`

### 4.4 사용자 프로필 수정

`PATCH /users/{user_id}`

Request Body:

```json
{
  "nickname": "잠실직관러",
  "favorite_team": "두산 베어스",
  "fan_since_year": 2021,
  "favorite_player": "정수빈",
  "home_stadium": "잠실야구장"
}
```

처리 규칙:

- 전달된 필드만 수정합니다.
- `nickname`, `favorite_team`, `favorite_player`, `home_stadium`은 앞뒤 공백을 제거합니다.
- `fan_since_year`는 `1900` 이상 `2100` 이하만 허용합니다.
- 닉네임 중복은 `400`으로 거절합니다.

## 5. Games API

### 5.1 경기 생성 또는 업데이트

`POST /games`

Request Body:

```json
{
  "game_date": "2026-05-15T18:30:00",
  "stadium": "잠실야구장",
  "home_team": "두산 베어스",
  "away_team": "LG 트윈스",
  "home_score": 5,
  "away_score": 3,
  "status": "경기 종료"
}
```

Response:

```json
{
  "id": 1,
  "game_date": "2026-05-15T18:30:00",
  "stadium": "잠실야구장",
  "home_team": "두산 베어스",
  "away_team": "LG 트윈스",
  "home_score": 5,
  "away_score": 3,
  "status": "경기 종료",
  "created_at": "2026-05-15T11:05:00",
  "updated_at": "2026-05-15T11:05:00"
}
```

처리 규칙:

- 같은 `game_date`, `stadium`, `home_team`, `away_team` 경기가 이미 있으면 새로 만들지 않고 점수와 상태를 업데이트합니다.
- `home_team`, `away_team`은 빈 값일 수 없습니다.
- 홈팀과 원정팀이 같으면 `400`으로 거절합니다.
- 점수는 `null` 또는 `0` 이상의 정수만 허용합니다.

### 5.2 경기 목록 조회

`GET /games`

Query Parameters:

| 이름 | 타입 | 설명 |
|---|---|---|
| game_date | date | 해당 날짜의 경기만 조회 |
| stadium | string | 해당 경기장만 조회 |

예시:

```text
GET /games?game_date=2026-05-15&stadium=잠실야구장
```

### 5.3 경기 단건 조회

`GET /games/{game_id}`

에러:

- 경기가 없으면 `404 Game not found`

### 5.4 경기 수정

`PATCH /games/{game_id}`

Request Body:

```json
{
  "home_score": 6,
  "away_score": 4,
  "status": "기록 완료"
}
```

처리 규칙:

- 전달된 필드만 수정합니다.
- 수정 후에도 홈팀과 원정팀은 달라야 합니다.
- 음수 점수는 `400`으로 거절합니다.

## 6. Entries API

### 6.1 직관 기록 생성

`POST /entries`

Request Body:

```json
{
  "user_id": 1,
  "game_id": 1,
  "watched_team": "두산 베어스",
  "memo": "9회 응원이 제일 기억남",
  "diary_text": null,
  "auto_generate_diary": true,
  "missions": [
    {
      "title": "응원 포인트 남기기",
      "is_completed": true
    },
    {
      "title": "좌석 시야 기록하기",
      "is_completed": false
    }
  ]
}
```

Response:

```json
{
  "id": 1,
  "user_id": 1,
  "game_id": 1,
  "watched_team": "두산 베어스",
  "memo": "9회 응원이 제일 기억남",
  "diary_text": "2026년 5월 15일 두산 베어스를 응원하러 간 길은...",
  "ticket_image_url": "/static/tickets/ticket_1.png",
  "is_win": true,
  "mission_success_count": 1,
  "missions": [
    {
      "id": 1,
      "title": "응원 포인트 남기기",
      "is_completed": true,
      "created_at": "2026-05-15T11:10:00",
      "updated_at": "2026-05-15T11:10:00"
    }
  ],
  "created_at": "2026-05-15T11:10:00",
  "updated_at": "2026-05-15T11:10:00"
}
```

처리 규칙:

- `user_id`가 존재해야 합니다.
- `game_id`가 존재해야 합니다.
- `watched_team`은 해당 경기의 `home_team` 또는 `away_team`이어야 합니다.
- 빈 미션 제목은 저장하지 않습니다.
- `auto_generate_diary=true`이면 OpenAI API 또는 로컬 fallback으로 다이어리를 생성합니다.
- `auto_generate_diary=false`이면 `diary_text` 또는 `memo` 중 하나가 있어야 합니다.
- 점수가 둘 다 있으면 응원 팀 기준으로 `is_win`을 계산합니다.
- 티켓 이미지 생성이 실패해도 직관 기록 저장은 유지합니다.

### 6.2 직관 기록 목록 조회

`GET /entries`

Query Parameters:

| 이름 | 타입 | 설명 |
|---|---|---|
| user_id | integer | 특정 사용자의 직관 기록만 조회 |
| game_id | integer | 특정 경기의 직관 기록만 조회 |

예시:

```text
GET /entries?user_id=1
```

### 6.3 직관 기록 단건 조회

`GET /entries/{entry_id}`

에러:

- 기록이 없으면 `404 Entry not found`

## 7. 배치 Import

경기 일정 CSV는 API가 아니라 운영용 스크립트로 import합니다.

```bash
PYTHONPATH=backend python backend/scripts/import_kbo_schedule.py ./schedule.csv --year 2026
```

CSV 필수 컬럼:

```text
date,time,game,stadium,note
```

옵션:

| 옵션 | 설명 |
|---|---|
| --dry-run | DB에 반영하지 않고 결과만 확인 |
| --strict | 실패 행이 있으면 전체 import 실패 |

출력 예시:

```text
created=120 updated=24 skipped=2
line=18 error=Unknown team in game: ...
```

## 8. 테스트

서비스 레이어 테스트는 SQLite 메모리 DB를 사용합니다.

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=backend python -m unittest discover backend/tests
```

현재 테스트 범위:

- 사용자 생성/수정 검증
- 경기 생성 upsert와 예외 처리
- 직관 기록 생성, 다이어리 fallback, 빈 미션 필터링
- CSV import 실패 행 리포트와 dry-run rollback
