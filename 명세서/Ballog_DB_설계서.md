# Ballog DB 설계서

## 1. 개요
Ballog는 KBO 직관 기록을 저장하고, 이후 AI 일기, 티켓 이미지, 통계 기능으로 확장되는 서비스입니다.  
현재 MVP 기준 DB는 사용자, 경기, 직관 기록, 직관 미션 4개 핵심 테이블로 구성됩니다.

## 2. 테이블 목록
- users
- games
- entries
- entry_missions

## 3. 테이블 상세

### 3.1 users
사용자 기본 정보와 선호 구단을 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 사용자 ID |
| username | VARCHAR | NOT NULL | 사용자 닉네임/이름 |
| email | VARCHAR | UNIQUE | 이메일 |
| favorite_team | VARCHAR | NULL 가능 | 선호 구단 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 수정일 |

비고:
- API에서는 `nickname`으로 받을 수 있으나, 현재 DB 컬럼은 `username` 기준으로 매핑되어 있습니다.

### 3.2 games
KBO 경기 정보를 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 경기 ID |
| home_team | VARCHAR | NOT NULL | 홈팀 |
| away_team | VARCHAR | NOT NULL | 원정팀 |
| venue | VARCHAR | NOT NULL | 경기장 |
| game_date | TIMESTAMP WITH TIME ZONE 또는 DATE | NOT NULL | 경기 날짜/시간 |
| home_score | INTEGER | NULL 가능 | 홈팀 점수 |
| away_score | INTEGER | NULL 가능 | 원정팀 점수 |
| status | VARCHAR | NULL 가능 | 경기 상태 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 수정일 |

비고:
- API에서는 `stadium`이라는 이름으로 받을 수 있으나, 현재 DB 컬럼은 `venue` 기준입니다.

### 3.3 entries
사용자의 직관 기록을 저장하는 핵심 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 직관 기록 ID |
| user_id | INTEGER | FK -> users.id | 사용자 ID |
| game_id | INTEGER | FK -> games.id | 경기 ID |
| watched_team | VARCHAR | NOT NULL | 해당 경기에서 사용자가 응원한 팀 |
| memo | TEXT | NULL 가능 | 사용자가 남긴 한 줄 기록 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 생성일 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 수정일 |

비고:
- 현재 MVP 기준으로 `diary_text`, `emotion_tag`, `ticket_image_url`, `is_win`, `mission_success_count`는 DB 컬럼에 아직 없을 수 있으며, 일부는 응답 계산값 또는 추후 확장 컬럼으로 처리될 수 있습니다.
- watched_team은 반드시 해당 경기의 `home_team` 또는 `away_team` 중 하나여야 합니다.

### 3.4 entry_missions
직관 기록에 연결된 미션을 저장하는 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INTEGER | PK | 미션 ID |
| entry_id | INTEGER | FK -> entries.id | 직관 기록 ID |
| title 또는 mission_text | VARCHAR/TEXT | NOT NULL | 미션 내용 |
| is_completed | BOOLEAN | NOT NULL | 완료 여부 |
| created_at | TIMESTAMP WITH TIME ZONE | NULL 가능 | 생성일 |

비고:
- 현재 구현에서는 요청/응답 스키마 기준으로 `title`을 사용할 가능성이 있습니다.
- 기존 설계 문서와 맞출 때는 `mission_text`로 통일하는 것이 더 명확합니다.

## 4. 관계 구조

- users 1 : N entries
- games 1 : N entries
- entries 1 : N entry_missions

텍스트 ERD:
```text
users
 └─ id (PK)
 └─ username
 └─ email
 └─ favorite_team
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
 └─ created_at
 └─ updated_at

entry_missions
 └─ id (PK)
 └─ entry_id (FK -> entries.id)
 └─ title / mission_text
 └─ is_completed
 └─ created_at
```

## 5. 핵심 비즈니스 규칙
- 사용자는 선호 구단을 가질 수 있습니다.
- 현재 인증 기능은 없으므로, 사용자 생성 후 ID 기반으로 기록을 연결합니다.
- 경기는 홈팀/원정팀/구장/일시 기준으로 저장됩니다.
- 점수가 둘 다 존재할 경우 승패 계산이 가능합니다.
- 직관 기록은 반드시 유효한 user_id, game_id를 가져야 합니다.
- watched_team은 선택한 경기의 홈팀 또는 원정팀 중 하나여야 합니다.
- 미션은 직관 기록 생성 시 함께 저장할 수 있습니다.
- 완료된 미션 수는 API 응답에서 계산될 수 있습니다.

## 6. 추후 확장 예정 컬럼/기능
entries 확장 후보:
- diary_text
- emotion_tag
- ticket_image_url
- is_win
- mission_success_count

기능 확장:
- 승요/패요 계산용 통계
- 구장별 승률
- 상대팀별 승률
- LLM 기반 AI 일기 생성
- Pillow 기반 티켓 이미지 생성

## 7. 현재 설계 상태 요약
현재 DB는 MVP 백엔드 테스트가 가능한 상태이며,
사용자 생성 → 경기 생성 → 직관 기록 생성 흐름을 지원합니다.

향후 정리 시 아래 통일을 권장합니다.
- `username` → `nickname`
- `venue` → `stadium`
- `title` → `mission_text`
