# Ballog 백엔드 구현 정리

## 1. 프로젝트 한 줄 설명

Ballog는 KBO 직관 기록을 저장하고, 직관 메모를 다이어리와 티켓 이미지로 변환해 보여주는 야구 팬 기록 서비스입니다.

면접용 요약:

> FastAPI와 SQLAlchemy 기반으로 사용자, 경기, 직관 기록 데이터를 관리하고, 외부 AI API 연동 실패에도 로컬 fallback으로 다이어리를 생성할 수 있도록 설계했습니다. 또한 CSV 배치 import, 입력값 검증, 서비스 레이어 테스트를 추가해 배포 가능한 수준의 안정성을 보강했습니다.

## 2. 백엔드 기술 스택

| 구분 | 기술 |
|---|---|
| API 서버 | FastAPI |
| ORM | SQLAlchemy |
| DB | PostgreSQL 배포 기준, 테스트는 SQLite 메모리 DB |
| 환경 변수 | python-dotenv |
| 이미지 생성 | Pillow |
| AI 연동 | OpenAI Responses API |
| 테스트 | Python unittest |

## 3. 폴더 구조

```text
backend/
  app/
    core/
      database.py          # DB 연결, 세션 생성
    models/
      user.py              # users 테이블
      game.py              # games 테이블
      entry.py             # entries 테이블
      entry_mission.py     # entry_missions 테이블
    routers/
      user_router.py       # /users API
      game_router.py       # /games API
      entry_router.py      # /entries API
    schemas/
      user_schema.py       # 요청/응답 스키마
      game_schema.py
      entry_schema.py
    services/
      user_service.py      # 사용자 비즈니스 로직
      game_service.py      # 경기 비즈니스 로직
      entry_service.py     # 직관 기록 생성 흐름
      diary_service.py     # AI/로컬 다이어리 생성
      ticket_service.py    # 티켓 이미지 생성
    main.py                # FastAPI 앱 생성, CORS, static mount
  scripts/
    import_kbo_schedule.py # KBO 일정 CSV import
  tests/
    test_services.py       # 서비스 레이어 테스트
```

## 4. 전체 동작 흐름

### 4.1 직관 기록 생성 흐름

```text
프론트 기록 작성 폼
  ↓
POST /entries
  ↓
entry_router.py
  ↓
entry_service.create_entry()
  ↓
1. user_id 존재 확인
2. game_id 존재 확인
3. watched_team이 경기 팀인지 확인
4. 빈 미션 제거
5. 다이어리 생성
6. Entry와 Mission DB 저장
7. 티켓 이미지 생성
8. Entry 응답 반환
```

핵심 포인트:

- 잘못된 `user_id`, `game_id`는 `404`로 거절합니다.
- 응원 팀이 실제 경기 팀과 다르면 `400`으로 거절합니다.
- 수동 다이어리인데 내용이 없으면 `400`으로 거절합니다.
- 티켓 이미지 생성 실패는 기록 저장 실패로 이어지지 않게 분리했습니다.

면접용 설명:

> 직관 기록은 사용자와 경기에 종속되는 핵심 데이터라서, 생성 전에 FK 대상 존재 여부와 응원 팀 정합성을 먼저 검증했습니다. 티켓 이미지는 부가 산출물이므로 생성 실패 시 로깅만 하고 기록 저장은 유지하도록 했습니다.

### 4.2 다이어리 생성 흐름

```text
entry_service
  ↓
diary_service.generate_diary()
  ↓
OPENAI_API_KEY 있음
  → OpenAI Responses API 호출
  → 응답 텍스트 정규화

OPENAI_API_KEY 없음 또는 호출 실패
  → 로컬 fallback 문장 생성
```

핵심 포인트:

- 외부 API 장애가 있어도 직관 기록 저장이 가능해야 합니다.
- OpenAI API 실패 시 `None`을 반환하고 로컬 생성 로직으로 넘어갑니다.
- 로컬 생성은 경기 날짜, 팀, 점수, 메모, 미션 정보를 조합합니다.

면접용 설명:

> 외부 AI API는 네트워크나 키 문제로 실패할 수 있기 때문에, API 호출 실패를 서비스 전체 장애로 전파하지 않고 로컬 fallback을 사용했습니다.

### 4.3 티켓 이미지 생성 흐름

```text
entry_service
  ↓
ticket_service.generate_ticket()
  ↓
Pillow로 이미지 생성
  ↓
backend/app/static/tickets/ticket_{entry_id}.png 저장
  ↓
ticket_image_url에 /static/tickets/... 저장
```

핵심 포인트:

- 티켓 이미지는 정적 파일로 저장됩니다.
- FastAPI에서 `/static` 경로를 mount해 프론트가 접근할 수 있게 했습니다.

면접용 설명:

> Pillow로 서버 측 이미지 생성 기능을 구현했고, 생성된 파일은 static 경로로 서빙했습니다. 기록 저장과 이미지 생성의 실패 범위를 분리해 핵심 데이터 손실을 막았습니다.

## 5. 서비스 레이어 분리

라우터는 HTTP 요청/응답을 담당하고, 실제 로직은 서비스 레이어에서 처리합니다.

```text
router
  ↓
service
  ↓
model / DB
```

예시:

- `game_router.py`: 요청을 받고 `game_service` 호출
- `game_service.py`: 점수 검증, 같은 경기 upsert, 경기 조회

장점:

- API 계층과 비즈니스 로직이 섞이지 않습니다.
- 서비스 함수 단위로 테스트하기 쉽습니다.
- 프론트 요구사항이 바뀌어도 핵심 로직을 재사용할 수 있습니다.

면접용 설명:

> 라우터는 얇게 유지하고 서비스 레이어에 도메인 검증과 DB 처리 로직을 모았습니다. 그래서 테스트도 API 서버를 띄우지 않고 서비스 함수 중심으로 작성할 수 있었습니다.

## 6. 예외 처리와 입력값 검증

### 6.1 사용자

검증:

- 이메일/닉네임 공백 제거
- 빈 이메일/닉네임 거절
- 이메일/닉네임 중복 거절
- 팬 시작 연도는 `1900` 이상 `2100` 이하만 허용

### 6.2 경기

검증:

- 홈팀/원정팀 공백 제거
- 빈 팀명 거절
- 홈팀과 원정팀 동일한 경우 거절
- 음수 점수 거절
- 같은 경기 생성 요청은 새 row 생성 대신 점수/상태 업데이트

### 6.3 직관 기록

검증:

- 존재하지 않는 사용자 거절
- 존재하지 않는 경기 거절
- 응원 팀이 홈팀/원정팀 중 하나가 아니면 거절
- 빈 미션 제목은 저장하지 않음
- 수동 다이어리 저장 시 내용이 없으면 거절

면접용 설명:

> DB에 저장되기 전에 서비스 레이어에서 도메인 규칙을 검증했습니다. 단순 스키마 검증뿐 아니라 “홈팀과 원정팀은 같을 수 없다”, “응원 팀은 실제 경기 팀이어야 한다” 같은 서비스 규칙을 명시적으로 처리했습니다.

## 7. 경기 일정 CSV 배치 Import

운영자가 KBO 경기 일정 CSV를 DB에 적재할 수 있는 스크립트입니다.

실행:

```bash
PYTHONPATH=backend python backend/scripts/import_kbo_schedule.py ./schedule.csv --year 2026
```

CSV 필수 컬럼:

```text
date,time,game,stadium,note
```

예시:

```csv
date,time,game,stadium,note
5.15(금),18:30,LG3vs5두산,잠실,-
5.16(토),18:30,KIAvs롯데,사직,-
```

옵션:

- `--dry-run`: 실제 DB 저장 없이 결과만 확인
- `--strict`: 실패 행이 있으면 전체 import 실패

동작:

```text
CSV 읽기
  ↓
헤더 검증
  ↓
각 행 파싱
  ↓
팀명/구장명 정규화
  ↓
이미 있는 경기면 업데이트
없으면 생성
  ↓
생성/수정/스킵 개수 출력
```

면접용 설명:

> 반복적으로 들어오는 경기 일정 데이터를 수동 입력하지 않도록 CSV 배치 import를 만들었습니다. dry-run으로 반영 전 검증이 가능하고, strict 모드로 데이터 품질을 강하게 관리할 수 있습니다.

## 8. 테스트 전략

테스트 파일:

```text
backend/tests/test_services.py
```

실행:

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=backend python -m unittest discover backend/tests
```

테스트 특징:

- 실제 운영 DB를 사용하지 않습니다.
- SQLite 메모리 DB를 테스트마다 생성합니다.
- 서비스 레이어 함수를 직접 호출합니다.
- 외부 OpenAI API와 실제 이미지 생성은 테스트에서 우회합니다.

현재 테스트 범위:

| 테스트 대상 | 검증 내용 |
|---|---|
| user_service | 공백 제거, 팬 시작 연도 예외 |
| game_service | 같은 경기 upsert, 동일 팀 예외, 음수 점수 예외 |
| entry_service | 다이어리 fallback, 빈 미션 필터링, 수동 빈 다이어리 예외 |
| import_kbo_schedule | 실패 행 리포트, dry-run rollback |

면접용 설명:

> 외부 DB나 외부 API에 의존하지 않도록 SQLite 메모리 DB와 monkey patch를 사용해 서비스 로직을 검증했습니다. 이를 통해 핵심 비즈니스 규칙이 깨지는지 빠르게 확인할 수 있습니다.

## 9. 배포 시 확인할 것

필수 환경 변수:

```env
DATABASE_URL=postgresql://user:password@host:5432/ballog
OPENAI_API_KEY=
OPENAI_DIARY_MODEL=gpt-4.1-nano
FRONTEND_ORIGINS=https://frontend-domain.com
```

체크리스트:

- 백엔드 배포 환경에 `DATABASE_URL` 설정
- 프론트 배포 도메인을 `FRONTEND_ORIGINS`에 추가
- `OPENAI_API_KEY`는 공개 저장소에 올리지 않기
- `/static/tickets` 쓰기 권한 확인
- 배포 후 `/`, `/docs`, `/games`, `/entries` 확인

추천 배포 구성:

```text
Frontend: Vercel
Backend: Render 또는 Railway
Database: Render PostgreSQL, Railway PostgreSQL, Supabase 등
```

## 10. 현재 강점과 한계

### 강점

- FastAPI 기반 API 서버
- SQLAlchemy ORM 모델링
- 프론트/백엔드 분리
- 외부 AI API 연동과 fallback 처리
- 서버 사이드 티켓 이미지 생성
- CSV 배치 import
- 서비스 레이어 분리
- 단위 테스트 추가
- README/API/DB 문서화

### 한계

- 인증/로그인은 현재 제외
- Alembic 마이그레이션 미도입
- 테스트가 라우터 통합 테스트보다는 서비스 레이어 중심
- 티켓 이미지는 로컬 파일 시스템 저장 기준

면접에서 한계를 말하는 방식:

> 현재 버전은 데모 서비스 성격이라 인증은 제외했고, 대신 기록 생성과 조회 흐름의 완성도에 집중했습니다. 실제 운영으로 확장한다면 Alembic 마이그레이션, 인증, 외부 스토리지 연동을 추가할 계획입니다.

## 11. 면접 답변 예시

### Q. 이 프로젝트 백엔드에서 가장 신경 쓴 부분은?

> 직관 기록 생성 흐름의 안정성을 신경 썼습니다. 사용자와 경기 존재 여부를 검증하고, 응원 팀이 실제 경기 팀인지 확인한 뒤 저장합니다. AI 다이어리 생성이나 티켓 이미지 생성처럼 실패 가능성이 있는 부가 기능은 fallback 또는 예외 처리로 분리해 핵심 기록 저장이 깨지지 않게 했습니다.

### Q. 테스트는 어떻게 했나요?

> 실제 DB를 건드리지 않도록 SQLite 메모리 DB를 사용했습니다. 서비스 레이어 테스트를 작성해 유저/경기/직관 기록 생성과 예외 처리, CSV import 동작을 검증했습니다.

### Q. 배치 import는 왜 만들었나요?

> 경기 일정은 한 건씩 수동 입력하기보다 CSV로 한 번에 넣는 게 현실적이라고 생각했습니다. 그래서 KBO 일정 CSV를 읽어 팀명과 구장명을 정규화하고, 기존 경기는 업데이트하고 새 경기는 생성하는 import 스크립트를 만들었습니다.

### Q. OpenAI API가 실패하면 어떻게 되나요?

> 외부 API 호출이 실패해도 기록 저장이 막히면 안 된다고 봤습니다. 그래서 OpenAI 응답이 없거나 오류가 나면 로컬 fallback 문장 생성 로직으로 다이어리를 만들어 저장합니다.

### Q. 왜 로그인 기능을 뺐나요?

> 이 프로젝트는 포트폴리오용 데모 앱이고 핵심 경험은 직관 기록 작성과 다이어리/티켓 확인입니다. 인증을 억지로 넣기보다 핵심 데이터 흐름, 예외 처리, 배치 import, 테스트에 집중했습니다.
