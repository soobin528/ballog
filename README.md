# Ballog

KBO 직관 기록을 남기고 티켓 이미지와 다이어리로 다시 보는 야구 팬용 기록 앱입니다.
프론트엔드는 Next.js, 백엔드는 FastAPI와 SQLAlchemy로 구성되어 있으며, 경기 일정 데이터 import와 AI 다이어리 생성 fallback 흐름을 포함합니다.

## 주요 기능

- 사용자 프로필, 경기 일정, 직관 기록 API
- 경기별 직관 메모와 미션 저장
- OpenAI Responses API 기반 다이어리 자동 생성, 실패 시 로컬 문장 생성으로 fallback
- 직관 기록 기반 티켓 이미지 생성 및 `/static` 서빙
- KBO 일정 CSV 배치 import
- 서비스 레이어 단위 테스트

## 구조

```text
backend/
  app/
    core/          # DB 설정
    models/        # SQLAlchemy 모델
    routers/       # FastAPI 라우터
    schemas/       # Pydantic 요청/응답 모델
    services/      # 비즈니스 로직
  scripts/         # 운영/배치 스크립트
  tests/           # 백엔드 테스트
frontend/
  src/app/         # Next.js App Router 페이지
  src/components/  # 화면 컴포넌트
  src/lib/         # API 클라이언트와 유틸
```

## 환경 변수

루트 `.env.example`을 참고해 `.env`를 구성합니다.

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ballog
OPENAI_API_KEY=
OPENAI_DIARY_MODEL=gpt-4.1-mini
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

`OPENAI_API_KEY`가 없거나 외부 API 호출이 실패해도 다이어리는 로컬 fallback 문장으로 생성됩니다.

## 로컬 실행

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=backend uvicorn app.main:app --reload
```

프론트엔드는 별도 터미널에서 실행합니다.

```bash
cd frontend
npm install
npm run dev
```

## KBO 일정 배치 Import

CSV는 `date`, `time`, `game`, `stadium`, `note` 컬럼을 사용합니다.

```bash
PYTHONPATH=backend python backend/scripts/import_kbo_schedule.py ./schedule.csv --year 2026
```

지원 옵션:

- `--dry-run`: DB에 반영하지 않고 생성/수정/스킵 결과만 확인
- `--strict`: 파싱 실패 행이 있으면 import 실패 처리

예상 출력:

```text
created=120 updated=24 skipped=2
line=18 error=Unknown team in game: ...
```

## 테스트

외부 DB 없이 SQLite 메모리 DB로 서비스 로직과 배치 import를 검증합니다.

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=backend python -m unittest discover backend/tests
```

## 배포 체크리스트

- 배포 DB의 `DATABASE_URL` 설정
- 프론트 배포 도메인을 `FRONTEND_ORIGINS`에 추가
- `OPENAI_API_KEY`는 서버 환경 변수로만 주입
- `/static/tickets`가 쓰기 가능한 환경인지 확인
- 배포 후 `/`, `/docs`, `/games`, `/entries` 헬스 체크
