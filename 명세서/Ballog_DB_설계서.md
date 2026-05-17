# Ballog DB 설계서

## 1. 개요

Ballog는 KBO 직관 기록을 사용자, 경기, 직관 기록, 미션 단위로 저장합니다. 현재 DB는 SQLAlchemy ORM 모델을 기준으로 구성되며, FastAPI 서버 시작 시 필요한 테이블을 생성합니다.

핵심 목적:

- 사용자 프로필 저장
- KBO 경기 일정과 결과 저장
- 사용자의 직관 기록 저장
- 직관 기록별 미션 저장
- 생성된 다이어리와 티켓 이미지 경로 저장

## 2. 테이블 목록

| 테이블 | 역할 |
|---|---|
| users | 사용자 프로필 |
| games | 경기 일정/결과 |
| entries | 직관 기록 |
| entry_missions | 직관 기록에 연결된 미션 |

## 3. 테이블 상세

### 3.1 users

사용자 프로필과 야구 취향 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, index | 사용자 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL, index | 사용자 닉네임 |
| email | VARCHAR(255) | UNIQUE, NOT NULL, index | 이메일 |
| favorite_team | VARCHAR(100) | NULL | 응원 팀 |
| fan_since_year | INTEGER | NULL | 야구팬 시작 연도 |
| favorite_player | VARCHAR(100) | NULL | 최애 선수 |
| home_stadium | VARCHAR(255) | NULL | 주 직관 구장 |
| created_at | DateTime(timezone=True) | NOT NULL, server_default | 생성일 |
| updated_at | DateTime(timezone=True) | NOT NULL, server_default, onupdate | 수정일 |

비고:

- API에서는 `nickname`으로 받고, DB에는 `username`으로 저장합니다.
- `fan_since_year`, `favorite_player`, `home_stadium`은 프로필 확장 컬럼입니다.

### 3.2 games

KBO 경기 일정과 결과를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, index | 경기 ID |
| home_team | VARCHAR(100) | NOT NULL | 홈팀 |
| away_team | VARCHAR(100) | NOT NULL | 원정팀 |
| venue | VARCHAR(255) | NULL | 경기장 |
| game_date | DateTime(timezone=True) | NOT NULL | 경기 날짜/시간 |
| home_score | INTEGER | NULL | 홈팀 점수 |
| away_score | INTEGER | NULL | 원정팀 점수 |
| status | VARCHAR(50) | NULL | 경기 상태 |
| created_at | DateTime(timezone=True) | NOT NULL, server_default | 생성일 |
| updated_at | DateTime(timezone=True) | NOT NULL, server_default, onupdate | 수정일 |

비고:

- API에서는 `stadium`으로 받고, DB에는 `venue`로 저장합니다.
- 동일한 `game_date`, `venue`, `home_team`, `away_team` 조합으로 생성 요청이 오면 기존 경기의 점수/상태를 업데이트합니다.

### 3.3 entries

사용자의 직관 기록을 저장하는 핵심 테이블입니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, index | 직관 기록 ID |
| user_id | INTEGER | FK -> users.id, NOT NULL | 사용자 ID |
| game_id | INTEGER | FK -> games.id, NOT NULL | 경기 ID |
| watched_team | VARCHAR(100) | NOT NULL | 응원한 팀 |
| memo | TEXT | NULL | 사용자가 남긴 메모 |
| diary_text | TEXT | NULL | 자동 또는 수동 생성된 다이어리 |
| ticket_image_url | VARCHAR(255) | NULL | 생성된 티켓 이미지 경로 |
| created_at | DateTime(timezone=True) | NOT NULL, server_default | 생성일 |
| updated_at | DateTime(timezone=True) | NOT NULL, server_default, onupdate | 수정일 |

비고:

- `watched_team`은 연결된 경기의 `home_team` 또는 `away_team` 중 하나여야 합니다.
- `is_win`, `mission_success_count`는 DB 컬럼이 아니라 API 응답에서 계산합니다.
- 티켓 이미지 경로는 `/static/tickets/ticket_{entry_id}.png` 형태로 저장됩니다.

### 3.4 entry_missions

직관 기록에 연결된 미션을 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, index | 미션 ID |
| entry_id | INTEGER | FK -> entries.id, NOT NULL | 직관 기록 ID |
| title | VARCHAR(255) | NOT NULL | 미션 제목 |
| is_completed | BOOLEAN | NOT NULL, default=False | 완료 여부 |
| created_at | DateTime(timezone=True) | NOT NULL, server_default | 생성일 |
| updated_at | DateTime(timezone=True) | NOT NULL, server_default, onupdate | 수정일 |

비고:

- 직관 기록 생성 시 함께 저장합니다.
- 빈 제목의 미션은 서비스 레이어에서 필터링합니다.

## 4. 관계 구조

```text
users 1 : N entries
games 1 : N entries
entries 1 : N entry_missions
```

텍스트 ERD:

```text
users
 └─ id (PK)
 └─ username
 └─ email
 └─ favorite_team
 └─ fan_since_year
 └─ favorite_player
 └─ home_stadium
 └─ created_at
 └─ updated_at

games
 └─ id (PK)
 └─ home_team
 └─ away_team
 └─ venue
 └─ game_date
 └─ home_score
 └─ away_score
 └─ status
 └─ created_at
 └─ updated_at

entries
 └─ id (PK)
 └─ user_id (FK -> users.id)
 └─ game_id (FK -> games.id)
 └─ watched_team
 └─ memo
 └─ diary_text
 └─ ticket_image_url
 └─ created_at
 └─ updated_at

entry_missions
 └─ id (PK)
 └─ entry_id (FK -> entries.id)
 └─ title
 └─ is_completed
 └─ created_at
 └─ updated_at
```

## 5. ORM 관계

### User

```text
User.entries -> Entry 목록
```

- `cascade="all, delete-orphan"` 설정으로 사용자가 삭제되면 연결된 직관 기록도 함께 삭제됩니다.

### Game

```text
Game.entries -> Entry 목록
```

- 경기 삭제 시 연결된 직관 기록도 함께 삭제됩니다.

### Entry

```text
Entry.user -> User
Entry.game -> Game
Entry.missions -> EntryMission 목록
```

- 직관 기록 삭제 시 연결된 미션도 함께 삭제됩니다.

### EntryMission

```text
EntryMission.entry -> Entry
```

## 6. 핵심 비즈니스 규칙

- 사용자는 고유한 이메일과 닉네임을 가져야 합니다.
- 사용자 프로필은 응원 팀, 야구팬 시작 연도, 최애 선수, 주 직관 구장을 저장할 수 있습니다.
- 홈팀과 원정팀은 같을 수 없습니다.
- 경기 점수는 `null` 또는 `0` 이상의 정수여야 합니다.
- 직관 기록은 반드시 유효한 `user_id`, `game_id`를 가져야 합니다.
- `watched_team`은 해당 경기의 홈팀 또는 원정팀이어야 합니다.
- `auto_generate_diary=false`이면 `memo` 또는 `diary_text` 중 하나가 있어야 합니다.
- 빈 미션 제목은 저장하지 않습니다.
- 점수가 모두 있으면 API 응답에서 응원 팀 기준 승패를 계산합니다.

## 7. 생성 데이터와 계산 데이터

DB에 저장되는 값:

- 사용자 프로필
- 경기 일정/결과
- 직관 메모
- 다이어리 본문
- 티켓 이미지 URL
- 미션 목록

API 응답에서 계산되는 값:

- `is_win`: 경기 점수와 응원 팀 기준 승패
- `mission_success_count`: 완료된 미션 개수

## 8. 운영/배포 고려사항

- 서버 시작 시 `Base.metadata.create_all()`로 테이블을 생성합니다.
- 기존 DB에 프로필 확장 컬럼이 없을 경우 `main.py`에서 `ALTER TABLE`로 보강합니다.
- 실제 운영 환경에서는 Alembic 같은 마이그레이션 도구 도입을 고려할 수 있습니다.
- 티켓 이미지는 `backend/app/static/tickets` 아래에 저장되므로 배포 환경에서 쓰기 권한이 필요합니다.
- `DATABASE_URL`은 환경 변수로 주입합니다.

## 9. 현재 설계 상태

현재 DB 설계는 아래 흐름을 지원합니다.

```text
사용자 생성/수정
 → 경기 생성/수정 또는 CSV import
 → 직관 기록 생성
 → 다이어리 생성
 → 티켓 이미지 생성
 → 컬렉션/다이어리/마이페이지 조회
```

향후 확장 후보:

- Alembic 마이그레이션
- 통계 전용 테이블 또는 캐시
- 다중 사용자 인증 구조
- 이미지 저장소를 로컬 디스크에서 S3 같은 외부 스토리지로 분리
