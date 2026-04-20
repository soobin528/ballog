# Ballog API 명세서

## 1. 개요
Ballog는 KBO 직관 기록 서비스를 위한 백엔드 API를 제공합니다.  
현재 MVP 기준으로 사용자, 경기, 직관 기록 관련 CRUD 일부 기능이 구현되어 있습니다.

Base URL 예시:
```text
http://127.0.0.1:8000
```

Swagger 문서:
```text
http://127.0.0.1:8000/docs
```

## 2. API 목록

### Users
- POST /users
- GET /users/{user_id}
- GET /users

### Games
- POST /games
- GET /games/{game_id}
- GET /games

### Entries
- POST /entries
- GET /entries/{entry_id}
- GET /entries

## 3. Users API

### 3.1 사용자 생성
POST /users

Request Body
```json
{
  "email": "fan@ballog.com",
  "nickname": "doosan_lover",
  "favorite_team": "Doosan Bears"
}
```

Response 예시
```json
{
  "id": 1,
  "username": "doosan_lover",
  "email": "fan@ballog.com",
  "favorite_team": "Doosan Bears",
  "created_at": "2026-04-20T11:00:00",
  "updated_at": "2026-04-20T11:00:00"
}
```

### 3.2 사용자 단건 조회
GET /users/{user_id}

### 3.3 사용자 목록 조회
GET /users

## 4. Games API

### 4.1 경기 생성
POST /games

Request Body
```json
{
  "game_date": "2026-04-20",
  "stadium": "Jamsil Baseball Stadium",
  "home_team": "Doosan Bears",
  "away_team": "LG Twins",
  "home_score": 5,
  "away_score": 3,
  "status": "finished"
}
```

Response 예시
```json
{
  "id": 1,
  "home_team": "Doosan Bears",
  "away_team": "LG Twins",
  "venue": "Jamsil Baseball Stadium",
  "game_date": "2026-04-20T00:00:00",
  "home_score": 5,
  "away_score": 3,
  "status": "finished",
  "created_at": "2026-04-20T11:05:00",
  "updated_at": "2026-04-20T11:05:00"
}
```

### 4.2 경기 단건 조회
GET /games/{game_id}

### 4.3 경기 목록 조회
GET /games

Query Parameter
- game_date
- stadium

## 5. Entries API

### 5.1 직관 기록 생성
POST /entries

Request Body 예시
```json
{
  "user_id": 1,
  "game_id": 1,
  "watched_team": "Doosan Bears",
  "memo": "9회 수비까지 정말 재밌었던 경기",
  "missions": [
    {
      "title": "응원가 따라부르기",
      "is_completed": true
    },
    {
      "title": "직관 사진 남기기",
      "is_completed": false
    }
  ]
}
```

Response 예시
```json
{
  "id": 1,
  "user_id": 1,
  "game_id": 1,
  "watched_team": "Doosan Bears",
  "memo": "9회 수비까지 정말 재밌었던 경기",
  "is_win": true,
  "mission_success_count": 1,
  "missions": [
    {
      "id": 1,
      "title": "응원가 따라부르기",
      "is_completed": true
    },
    {
      "id": 2,
      "title": "직관 사진 남기기",
      "is_completed": false
    }
  ],
  "created_at": "2026-04-20T11:10:00",
  "updated_at": "2026-04-20T11:10:00"
}
```

유효성 규칙:
- user_id가 존재해야 함
- game_id가 존재해야 함
- watched_team은 해당 경기의 home_team 또는 away_team 중 하나여야 함
- 점수가 둘 다 존재하면 is_win 계산 가능
- 완료된 미션 수를 기준으로 mission_success_count 계산

### 5.2 직관 기록 단건 조회
GET /entries/{entry_id}

### 5.3 직관 기록 목록 조회
GET /entries

Query Parameter
- user_id
- game_id

## 6. 에러 처리 기준
- 400 Bad Request: watched_team 불일치, 잘못된 요청
- 404 Not Found: user/game/entry 없음
- 422 Unprocessable Entity: 스키마 검증 실패

## 7. 현재 MVP 상태 요약
현재 API는 아래 흐름을 지원합니다.
1. 사용자 생성
2. 경기 생성
3. 직관 기록 생성
4. 생성된 기록/경기/사용자 조회

아직 미구현 또는 추후 확장 예정 기능:
- AI 일기 생성
- 티켓 이미지 생성
- 통계 API
- 인증/로그인
- 컬렉션 전용 조회 API

## 8. 테스트 권장 순서
1. POST /users
2. POST /games
3. POST /entries
4. GET /users/{id}
5. GET /games/{id}
6. GET /entries/{id}

## 9. 참고사항
현재 구현은 MVP 기준으로 동작 검증이 완료된 상태이며,
일부 필드명은 API 입력명과 DB 컬럼명이 완전히 같지 않을 수 있습니다.

정리 권장:
- nickname ↔ username
- stadium ↔ venue
- title ↔ mission_text
