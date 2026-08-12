# 将棋道場 (Shogi Dojo)

일본 전통 보드게임 쇼기(将棋)를 처음 접하는 사람이 **규칙을 배우고 → 연습하고 → 컴퓨터/온라인으로 대전하고 → 대국을 복기**하는 흐름을 하나로 묶은 웹 서비스입니다.

이름의 "道場(도장)"은 실제 일본의 오래된 쇼기 도장을 가리키는 단어를 그대로 가져온 것으로, 이 프로젝트가 지향하는 "낡았지만 정겨운 1990년대 일본 개인 홈페이지 + 전통 쇼기 도장" 톤을 그대로 담고 있습니다.

[Demo](#) · [GitHub](https://github.com/gajigaji04/Shogi_Dojo.git) · [배포 가이드](./DEPLOY.md)

> 개인 포트폴리오 프로젝트입니다. Demo 링크는 아직 라이브 배포 전이라 비워두었습니다.

---

## 📌 프로젝트 소개

쇼기는 체스나 장기와 달리 **잡은 상대 기물을 자신의 것으로 다시 사용(持ち駒)**할 수 있다는 독특한 규칙을 가지고 있어, 규칙 자체가 처음 보는 사람에게 낯섭니다. 시중의 쇼기 사이트 대부분은 "규칙을 이미 아는 사람"을 전제로 대국 기능만 제공하는데, 이 프로젝트는 그 앞 단계 — **규칙을 실제로 몸으로 익히는 과정**을 핵심으로 설계했습니다.

- **왜 만들었는가**: 쇼기 규칙(특히 打ち歩詰め, 連続王手의 千日手처럼 예외적인 규칙)을 정확하게 구현하는 것 자체가 도메인 로직을 다루는 좋은 연습이라 판단했고, 여기에 실제로 동작하는 회원가입/온라인 대전/DB까지 붙여 "장난감 프로젝트"가 아닌 서비스 형태로 완성하는 것을 목표로 삼았습니다.
- **대상 사용자**: 쇼기를 전혀 모르는 초심자(한국어/일본어/영어 사용자 모두), 그리고 몇 판 정도 실제로 두고 싶은 사람.
- **방향성**: 규칙 학습 → 튜토리얼 대국 → CPU 대전 → 온라인 대전 → 기보 복기가 서로 끊기지 않고 이어지도록 설계했습니다. 예를 들어 학습 페이지의 튜토리얼은 별도의 "가짜 보드"가 아니라 **실제 대국에 쓰이는 규칙 엔진과 보드 컴포넌트를 그대로 재사용**합니다.
- **UX/UI 방향**: "1990년대 일본 웹사이트 + 목재색 쇼기판" 느낌의 레트로 비주얼(고정폭 레이아웃, 얇은 테두리, 명조×고딕 조합)과 "쇼기판이 항상 화면의 중심" 원칙을 유지하면서도, 실제 조작감(반응형 대응, 버튼 터치 영역, 로딩/에러 상태 표시)은 현대적인 웹 앱 수준을 목표로 했습니다.

## ✨ 주요 기능

### 쇼기 학습 (`/learn`)

- 6단계 인터랙티브 프롤로그(보드 소개 → 기물 종류 → 이동 → 성 → 持ち駒 → 튜토리얼 대국 안내)와 기물별 이동 범위를 시각화하는 기물 사전을 제공합니다.
- 튜토리얼 대국(`/learn/tutorial`)은 이동·포획·드롭·성·체크 5단계를 실제로 클릭하며 진행하는데, 이때 사용하는 것은 실제 대국과 동일한 `useShogiGame` 훅 + `gameReducer`입니다. 각 단계에서 사용자가 둘 수 있는 칸/기물을 제한하는 방식으로 "가이드형" 진행을 구현했습니다(`src/pages/TutorialGamePage.tsx`).

### 컴퓨터 대전 (`/play/cpu`)

- 5단계 난이도(아주 쉬움~매우 어려움)를 제공합니다. 최하 난이도는 합법수 중 무작위 선택(`RandomCpuEngine`), 그 외 난이도는 **알파-베타 가지치기 + iterative deepening 미니맥스**(`src/game/ai/minimax.ts`)로 시간 예산(120ms~1.4초) 안에서 최선의 수를 탐색합니다.
- 평가 함수(`src/game/ai/evaluate.ts`)는 기물 가치, 持ち駒(잡은 기물) 가치, 왕 주변 안전도, 보병 전진도를 반영합니다.

### 온라인 대전 (`/play/online`, 로그인 필요)

- 로그인한 사용자끼리 실시간(폴링 기반, 약 0.9~1.2초 간격)으로 대전합니다.
- **모든 수는 서버가 재검증**합니다(`server/src/online/routes.ts`). 클라이언트가 보낸 수를 그대로 믿지 않고, 서버가 클라이언트와 동일한 `gameReducer`로 직접 계산해서 실제로 상태가 바뀔 때만(=합법수일 때만) 반영합니다.
- 새로고침해도 `localStorage`에 저장된 대국 ID로 진행 중이던 대국이 그대로 이어집니다(재접속).
- 상대가 90초 이상 응답하지 않으면 "승리 처리 요청" 버튼이 나타나 시간패를 청구할 수 있습니다.

### 기보 / 복기 (`/replay`, `/kifu`)

- 모든 대국은 수순마다 일본식 기보 표기(예: `▲７六歩`)로 자동 기록됩니다(`src/game/notation/kifu.ts`).
- 복기 화면에서 처음/이전/다음/자동재생/배속 조절이 가능합니다.
- KIF 형식 기보 파일을 업로드하면(`src/game/notation/kifParser.ts`) Shift-JIS 인코딩을 우선 시도해 자동 디코딩하고, 파싱된 수순을 실제 `gameReducer`로 처음부터 재생해서 **규칙상 성립하지 않는 기보는 가져오기를 거부**합니다. 平手(맞바둑) 대국만 지원합니다.

### 회원가입 / 로그인

- 이메일/비밀번호/닉네임으로 회원가입하며, 서버에서 이메일·닉네임 중복과 비밀번호 길이 등을 Zod로 검증합니다.
- 로그인 시 JWT를 발급하고, 프론트엔드는 이를 `localStorage`에 저장한 뒤 매 요청 `Authorization` 헤더에 실어 보냅니다. 새로고침 시 `/api/auth/me` 호출로 세션을 복원합니다(`src/auth/AuthContext.tsx`).

### 공지사항 / 문의하기

- 공지사항은 한/일/영 3개 언어 컬럼을 각각 가진 `Notice` 테이블에서 조회합니다.
- 문의 폼은 실제로 `Contact` 테이블에 저장되며, 서버에서 이름/이메일/제목/내용을 검증합니다.

### 다국어

- 한국어/日本語/English 전체 UI를 `t("key")` 형태로 처리하며(`src/i18n/`), 번역 리소스는 `ko.json` / `ja.json` / `en.json`로 분리되어 있습니다.

## 🖥️ 주요 화면

> 스크린샷 파일은 아직 저장소에 포함되어 있지 않습니다(추후 추가 예정). 대신 각 화면의 경로와 기능을 정리했습니다.

| 화면 | 경로 | 설명 |
|---|---|---|
| 메인 | `/` | 서비스 소개, 초기 배치 쇼기판, 최근 공지 |
| 로그인 / 회원가입 | `/login`, `/register` | 이메일 기반 인증 폼 |
| 쇼기 학습 | `/learn` | 6단계 프롤로그 + 기물 사전 |
| 튜토리얼 대국 | `/learn/tutorial` | 실제 엔진 기반 가이드형 미니 대국 |
| 컴퓨터 대전 | `/play/cpu` | 난이도 선택 후 CPU와 대국 |
| 온라인 대전 | `/play/online` | 매칭 대기 → 실시간(폴링) 대전 |
| 기보 복기 | `/replay`, `/replay/:id` | 내 대국 목록, 수순별 재생 |
| 기보 불러오기 | `/kifu` | KIF 파일 업로드 → 복기 화면으로 이동 |
| 도장(마이페이지) | `/profile` | 전적(승/패/무), 최근 대국 목록 |

## 🛠️ 기술 스택

### Frontend

| 기술 | 용도 |
|---|---|
| React 19 + TypeScript | UI 및 쇼기 규칙 엔진 전체를 타입 안전하게 작성 |
| Vite | 개발 서버 및 번들링 |
| React Router 7 | SPA 클라이언트 라우팅 |
| CSS Modules | 컴포넌트 스코프 스타일 (별도 UI 라이브러리 없이 디자인 시스템 토큰 기반으로 직접 구현) |
| Vitest | 쇼기 규칙 엔진 유닛 테스트 |

### Backend

| 기술 | 용도 |
|---|---|
| Node.js + Express | REST API 서버 |
| Prisma | PostgreSQL ORM, 스키마/마이그레이션 관리 |
| PostgreSQL | 회원/대국/기보/공지/문의 데이터 저장 |
| jsonwebtoken | JWT 발급/검증 (stateless 인증) |
| bcryptjs | 비밀번호 해시 |
| zod | 요청 바디 서버측 검증 |
| cors | 프론트엔드 도메인의 CORS 허용 |

### Infrastructure / Dev Tools

| 기술 | 용도 |
|---|---|
| Vercel | 프론트엔드 정적 호스팅 + 백엔드를 서버리스 함수로 배포 (설정 완료, 실배포는 별도 진행) |
| Docker | 로컬 개발 시 PostgreSQL 컨테이너 실행 (저장소에 Dockerfile/compose는 없고, 로컬 실행용 명령만 사용) |
| tsx | 백엔드 TypeScript를 빌드 없이 실행 (로컬 dev 서버) |

## 🏗️ 시스템 아키텍처

```mermaid
flowchart TB
    subgraph Client["브라우저 (React SPA)"]
        UI["UI 컴포넌트\n(ShogiBoard, GameBoardPanel...)"]
        Engine["쇼기 규칙 엔진\n(src/game, 순수 TS)"]
        UI <--> Engine
    end

    subgraph Vercel["Vercel"]
        Static["정적 호스팅 (dist/)"]
        Func["서버리스 함수\napi/[...path].ts\n= server/src/app.ts (Express)"]
    end

    subgraph DB["PostgreSQL"]
        Tables["User / Game / GameMove\nMatchQueue / Contact / Notice"]
    end

    Client -- "fetch('/api/...')" --> Func
    Static -- "정적 파일 서빙" --> Client
    Func -- "동일한 gameReducer로\n서버측 재검증" --> Engine
    Func <--> Tables
```

로컬 개발 환경에서는 `Vercel` 부분이 두 개의 독립 프로세스로 대체됩니다 — 프론트엔드는 `vite`(포트 5173), 백엔드는 `server/src/index.ts`가 `app.listen()`으로 직접 띄우는 Express 서버(포트 8787)입니다. **`api/[...path].ts`와 `server/src/index.ts`는 동일한 `createApp()`(`server/src/app.ts`)을 사용**하므로 두 환경에서 라우트 코드는 완전히 같습니다.

온라인 대전은 WebSocket이 아니라 **HTTP 폴링**으로 동작합니다. Vercel 서버리스 함수는 요청마다 실행되고 종료되어 지속적인 연결이나 인메모리 상태를 유지할 수 없기 때문에, 매칭 대기열과 대국 상태를 전부 PostgreSQL(`MatchQueue`, `Game.stateJson`)에 저장하고 클라이언트가 주기적으로 조회하는 방식을 택했습니다.

```mermaid
sequenceDiagram
    participant A as Player A
    participant S as /api/online (서버)
    participant D as PostgreSQL
    participant B as Player B

    A->>S: POST /queue/join
    B->>S: POST /queue/join
    S->>D: 대기열에서 상대 탐색 (advisory lock)
    S->>D: Game row 생성 (stateJson = 초기 상태)
    S-->>B: matched: true, gameId, color

    loop 대국 진행
        A->>S: POST /games/:id/move
        S->>S: gameReducer(state, move)로 재검증
        S->>D: stateJson 갱신 + GameMove 기록
        S-->>A: 갱신된 state (응답으로 즉시 반영)
        B->>S: GET /games/:id/state (폴링)
        S-->>B: 갱신된 state
    end
```

## 📂 프로젝트 구조

```text
.
├── src/                        # 프론트엔드 (Vite + React)
│   ├── api/                     # fetch 기반 API 클라이언트
│   ├── auth/                    # AuthContext, 토큰 저장(localStorage)
│   ├── components/
│   │   ├── common/                # RetroButton, RetroPanel, RetroHeader, RetroDialog 등 공통 UI
│   │   ├── shogi/                  # ShogiBoard, ShogiPiece, CapturedPieces, MoveHistory 등 보드 UI
│   │   ├── game/                    # GameBoardPanel(보드+기록+대화상자 통합), ResultModal, DifficultySelect
│   │   └── learning/                 # PieceMoveDemo, PromotionDemo, DropDemo (학습 페이지용 데모)
│   ├── game/                      # 쇼기 규칙 엔진 — React/Express 어디에도 의존하지 않는 순수 TS
│   │   ├── types/                   # Board, Piece, Move, GameState 등 도메인 타입
│   │   ├── rules/                    # pieceMovement / promotion / drops / check / checkmate / repetition / legalMoves
│   │   ├── state/                     # gameState(초기 배치), gameReducer(상태 전이), tutorialState
│   │   ├── notation/                   # kifu.ts(기보 표기 생성), kifParser.ts(KIF 불러오기)
│   │   ├── ai/                          # cpuPlayer(엔진 선택), minimax, evaluate
│   │   ├── storage/                      # localStorage 기반 로컬 대국 기록(CPU 대전용)
│   │   └── __tests__/                     # Vitest 유닛 테스트 9개 파일 · 73개 케이스
│   ├── hooks/                     # useShogiGame(로컬) / useOnlineShogiGame(폴링) / useReplayPlayer
│   ├── i18n/                      # ko.json / ja.json / en.json, I18nContext
│   └── pages/                     # 라우트별 페이지 컴포넌트 (18개)
├── server/                       # 백엔드 (Express + Prisma)
│   ├── prisma/                    # schema.prisma, migrations/
│   └── src/
│       ├── app.ts                   # Express 앱 정의 — 로컬/Vercel 공용
│       ├── index.ts                  # 로컬 개발 진입점 (app.listen)
│       ├── db.ts                      # PrismaClient 싱글턴
│       ├── auth/                       # 회원가입/로그인/JWT 미들웨어
│       ├── contact/                     # 문의하기 API
│       ├── notice/                       # 공지사항 API
│       ├── games/                         # 대국 기록 조회 API
│       └── online/                         # 온라인 대전 폴링 API (매칭/수/투료/시간패)
├── api/
│   └── [...path].ts               # Vercel 서버리스 진입점 (server/src/app.ts를 감싸기만 함)
├── vercel.json                   # 빌드/설치 커맨드, SPA rewrite 규칙
└── DEPLOY.md                     # Vercel 배포 절차 문서
```

## 🗄️ ERD

`server/prisma/schema.prisma` 기준입니다.

```mermaid
erDiagram
    User ||--o{ Game : "player1 / player2 / winner"
    Game ||--o{ GameMove : "moves"
    User ||--o| MatchQueue : "대기 중일 때"

    User {
        string id PK
        string email UK
        string nickname UK
        string passwordHash
        datetime createdAt
    }

    Game {
        string id PK
        string player1Id FK
        string player2Id FK
        string winnerId FK "nullable"
        string status "PLAYING/FINISHED/ABANDONED"
        string resultKind "checkmate/resign/sennichite/perpetual_check/timeout"
        json stateJson "현재 GameState 스냅샷 전체"
        datetime lastMoveAt
        datetime startedAt
        datetime endedAt
    }

    GameMove {
        string id PK
        string gameId FK
        int moveNumber
        string playerId FK
        string moveData "JSON 문자열: move+notation+상태 스냅샷"
    }

    MatchQueue {
        string userId PK "FK, 사용자당 1행"
        datetime createdAt
    }

    Contact {
        string id PK
        string name
        string email
        string subject
        string message
        string status
    }

    Notice {
        string id PK
        string titleKo
        string titleJa
        string titleEn
        string contentKo
        string contentJa
        string contentEn
        datetime publishedAt
    }
```

## 📡 API

`server/src/*/routes.ts` 기준 실제 존재하는 엔드포인트만 정리했습니다. Swagger 등 API 문서 자동화 도구는 적용되어 있지 않습니다.

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/api/health` | 헬스체크 | 불필요 |
| POST | `/api/auth/register` | 회원가입 | 불필요 |
| POST | `/api/auth/login` | 로그인, JWT 발급 | 불필요 |
| POST | `/api/auth/logout` | 로그아웃 (클라이언트 토큰 폐기 요청) | 필요 |
| GET | `/api/auth/me` | 현재 로그인 사용자 조회 | 필요 |
| POST | `/api/contact` | 문의 등록 | 불필요 |
| GET | `/api/notices` | 공지사항 목록 | 불필요 |
| GET | `/api/notices/:id` | 공지사항 상세 | 불필요 |
| GET | `/api/games/mine` | 내 대국 목록 | 필요 |
| GET | `/api/games/:id` | 대국 상세 + 전체 기보 (본인 참가 대국만) | 필요 |
| POST | `/api/online/queue/join` | 매칭 대기열 참가 (상대 있으면 즉시 매칭) | 필요 |
| POST | `/api/online/queue/leave` | 매칭 취소 | 필요 |
| GET | `/api/online/queue/status` | 매칭 상태 폴링 | 필요 |
| GET | `/api/online/games/:id/state` | 대국 상태 폴링 | 필요 |
| POST | `/api/online/games/:id/move` | 수 제출 (서버가 규칙 엔진으로 재검증) | 필요 |
| POST | `/api/online/games/:id/resign` | 투료 | 필요 |
| POST | `/api/online/games/:id/claim-timeout` | 상대 무응답 시 승리 청구 (마지막 수로부터 90초 경과 후) | 필요 |

## 🔐 인증 및 보안

실제 코드에서 확인한 내용만 기재합니다.

- **비밀번호 해시**: `bcryptjs`로 해시하여 저장(`server/src/auth/hash.ts`). 평문 저장 없음.
- **JWT 인증**: 로그인 성공 시 30일 만료 JWT 발급(`server/src/auth/jwt.ts`). 세션을 서버에 저장하지 않는 stateless 구조.
- **인증 미들웨어**: `requireAuth`(`server/src/auth/middleware.ts`)가 `Authorization: Bearer <token>` 헤더를 검증하며, 로그인 필요 라우트에 일괄 적용.
- **요청 검증**: 회원가입/문의하기 요청 바디를 `zod` 스키마로 서버측에서 검증(클라이언트 검증과 별개로 서버에서 다시 확인).
- **대국 접근 제어**: `/api/games/:id`, `/api/online/games/:id/*`는 요청자가 해당 대국의 `player1` 또는 `player2`인 경우에만 응답 — 다른 사용자의 대국 ID를 알아내도 열람/조작 불가.
- **온라인 대전 수 검증**: 클라이언트가 보낸 수를 그대로 반영하지 않고, 서버가 저장된 `stateJson`에 대해 클라이언트와 동일한 `gameReducer`를 직접 실행한 뒤 상태가 실제로 바뀌었을 때만(=합법수일 때만) DB에 반영. 차례가 아닌 사용자의 요청, 존재하지 않는 기물을 움직이는 요청 등은 별도 분기로 거부.
- **매칭 동시성**: 두 사용자가 동시에 매칭을 시도할 때의 경쟁 상태를 막기 위해 PostgreSQL의 `pg_advisory_xact_lock`으로 매칭 트랜잭션을 직렬화.
- **CORS**: `cors` 미들웨어로 허용 origin을 환경변수(`CORS_ORIGIN`)로 제한.
- **HTTPS**: 별도로 구성한 적은 없으며, Vercel에 배포될 경우 플랫폼이 기본 제공하는 HTTPS에 의존합니다.

## 💡 주요 기술적 의사결정

**1. 쇼기 규칙 엔진을 프레임워크에서 완전히 분리하고, 프론트엔드와 백엔드가 같은 코드를 import**

- *문제*: 온라인 대전에서 클라이언트가 보낸 수를 서버가 검증하려면, 서버도 쇼기 규칙을 알아야 합니다. 규칙을 서버·클라이언트에 각각 구현하면 두 구현이 어긋날 위험이 생깁니다.
- *선택*: `src/game/`을 React·Express 어디에도 의존하지 않는 순수 TypeScript 모듈로 작성했습니다.
- *구현*: `server/src/online/routes.ts`가 상대 경로(`../../../src/game/state/gameReducer.js`)로 프론트엔드의 엔진 코드를 **그대로 import**해서 씁니다. 즉 로컬 CPU 대전과 서버의 온라인 대전 검증이 물리적으로 동일한 파일을 실행합니다.

**2. `ShogiGameController`라는 공통 인터페이스로 "게임 상태가 어디서 오는가"와 UI를 분리**

- *문제*: CPU 대전(로컬 상태)과 온라인 대전(서버 폴링 상태)은 데이터 흐름이 전혀 다르지만, 화면(보드/持ち駒/기보/승급 대화상자)은 똑같아야 합니다.
- *선택*: `useShogiGame`(로컬)과 `useOnlineShogiGame`(폴링)이 서로 다르게 구현되어 있으면서도 동일한 인터페이스(`state`, `selected`, `legalTargets`, `selectSquare`, `resolvePromotion`, `resign`...)를 반환하도록 설계했습니다(`src/hooks/shogiGameController.ts`).
- *구현*: `GameBoardPanel`은 이 인터페이스만 알고 있어서, CPU 대전 화면과 온라인 대전 화면이 보드 UI 컴포넌트를 그대로 재사용합니다.

**3. 온라인 대전 실시간 통신을 WebSocket 대신 HTTP 폴링으로 설계**

- *문제*: 온라인 대전을 위해서는 두 클라이언트 간 상태 동기화가 필요합니다. 처음에는 `ws` 패키지로 WebSocket 서버(인메모리 대기열/대국방)를 구현했습니다.
- *제약*: 배포 목표를 Vercel 서버리스로 정하면서, 서버리스 함수는 요청마다 실행·종료되어 지속적인 소켓 연결이나 인메모리 상태를 유지할 수 없다는 제약을 확인했습니다.
- *선택*: Pusher/Ably 같은 서드파티 실시간 서비스를 추가하는 대신, 모든 상태를 PostgreSQL에 저장하고 짧은 간격(0.9~1.2초)으로 폴링하는 방식으로 재설계했습니다. 추가 계정/API 키 없이 완전히 서버리스 호환이 되고, 부수적으로 "연결이 끊긴다"는 개념 자체가 없어져 새로고침 후 재접속이 자연스럽게 해결됐습니다.

**4. 데이터베이스를 SQLite에서 PostgreSQL로 전환**

- *문제*: 로컬 개발은 파일 기반 SQLite로 시작했지만, Vercel 서버리스 함수의 파일시스템은 요청 간 유지되지 않아 배포 시 DB가 계속 초기화되는 문제가 있었습니다.
- *선택*: 매니지드 PostgreSQL(Neon/Supabase 등)로 전환하고, Prisma의 `datasource` provider만 바꿔 스키마 자체는 그대로 재사용했습니다.

**5. CPU 엔진: 고정 depth 대신 시간 예산 기반 iterative deepening**

- *문제*: 쇼기는 持ち駒(드롭) 규칙 때문에 체스보다 한 국면에서 가능한 수의 개수가 훨씬 많아, 고정 depth로 탐색하면 국면에 따라 계산 시간이 크게 들쭉날쭉해질 수 있습니다.
- *선택*: "몇 수 앞까지 본다" 대신 "이 난이도는 몇 ms까지 탐색한다"로 설계해(`src/game/ai/minimax.ts`), 난이도별 응답 시간을 예측 가능한 범위로 제한했습니다.

## 🐛 트러블슈팅

### 千日手(반복수) 판정 테스트가 계속 실패함

**문제**
반복수 4회를 채우기 위해 4턴 주기 루프를 16수 분량으로 작성한 테스트가, 실행할 때마다 특정 시점부터 "합법수가 아님"으로 실패했습니다.

**원인**
반복 판정 로직 자체의 버그가 아니라, **실제로는 13수째에 이미 반복 조건이 충족되어 대국이 종료**되었는데 테스트 스크립트가 그 사실을 모른 채 나머지 예정된 수를 계속 밀어넣고 있었습니다. 반복 판정은 "정확히 한 사이클이 끝나는 시점"이 아니라 "같은 국면이 4번째로 나타나는 즉시" 발동하도록 구현되어 있었기 때문입니다.

**해결**
테스트 헬퍼가 `state.status !== "ongoing"`이 되는 순간 루프를 멈추도록 수정했습니다(`src/game/__tests__/repetition.test.ts`의 `playUntilEnded`).

**배운 점**
"내가 작성한 시나리오가 몇 수만에 끝나야 하는가"를 직접 계산해서 하드코딩하는 대신, 게임 상태 자체를 신뢰하고 그에 맞춰 테스트 흐름을 제어하는 편이 더 견고하다는 것을 확인했습니다.

### 셸에서 API를 테스트하다 한글이 깨진 채 DB에 저장됨

**문제**
`curl -d '{"name":"홍길동", ...}'`처럼 한글을 명령어에 직접 넣어 문의하기 API를 테스트했더니, 저장된 데이터가 mojibake(깨진 문자, `U+FFFD` 치환문자 포함)로 남았습니다.

**원인**
저장된 바이트를 직접 디코딩해본 결과, 데이터가 DB나 애플리케이션 코드에 도달하기 전에 이미 손상되어 있었습니다. UTF-8로 작성한 한글이 셸/OS의 코드페이지 계층을 거치며 깨진 것으로, **애플리케이션 코드의 문제가 아니라 테스트 방법의 문제**였습니다.

**해결**
같은 한글을 실제 브라우저 폼(자동화 도구로 입력창에 직접 타이핑)을 거쳐 다시 제출해 정상 저장을 확인했고, 이후 API를 셸에서 테스트할 때는 한글이 포함된 값은 명령어 인자에 직접 넣지 않고 파일에 써서 전달하는 방식으로 바꿨습니다.

**배운 점**
버그처럼 보이는 현상이 실제로는 애플리케이션이 아니라 재현 환경(터미널 인코딩)에서 발생할 수 있다는 것, 그리고 원인을 특정하려면 "저장된 실제 바이트"까지 내려가서 확인해야 한다는 것을 다시 확인했습니다.

### Windows에서 `npx prisma generate`가 EPERM으로 실패함

**문제**
Prisma 스키마 변경 후 클라이언트를 재생성하면 `query_engine-windows.dll.node` 파일 이름을 바꾸는 과정에서 `EPERM: operation not permitted` 오류가 발생했습니다.

**원인**
`tsx watch`로 띄워둔 백엔드 개발 서버 프로세스가 기존 Prisma 엔진 DLL을 붙잡고 있어 파일이 잠긴 상태였습니다.

**해결**
개발 서버 프로세스를 먼저 종료한 뒤 `prisma generate`를 다시 실행했습니다.

**배운 점**
Windows에서는 실행 중인 프로세스가 물고 있는 바이너리 파일을 다른 도구가 교체하지 못하는 경우가 있어, 코드 생성기를 다시 돌리기 전에 관련 프로세스를 먼저 종료하는 습관이 필요합니다.

## 🚀 배포 및 CI/CD

**CI 파이프라인은 구성되어 있지 않습니다.** GitHub Actions, Docker 이미지 빌드/레지스트리 업로드 등의 자동화 없이, 로컬에서 다음을 수동으로 실행해 검증한 뒤 배포합니다.

```text
npm test        # 프론트엔드 유닛 테스트 (Vitest)
tsc -b           # 프론트엔드 타입체크
tsc --noEmit     # 백엔드 타입체크 (server/ 디렉터리에서)
npm run build    # 프로덕션 빌드
```

**배포 대상은 Vercel입니다.** AWS/EC2/RDS/S3, Nginx, Docker Hub 등은 사용하지 않습니다. 배포 구조는 다음과 같이 설계되어 있습니다.

```text
GitHub 저장소
    ↓ (Vercel이 연결된 저장소를 감지)
Vercel Build
    ├─ npm install (root) + npm install --prefix server
    ├─ prisma generate (server/)
    └─ vite build → dist/
    ↓
Vercel 배포
    ├─ 정적 파일(dist/) → CDN
    └─ api/[...path].ts → 서버리스 함수
    ↓
PostgreSQL (Neon/Supabase 등 매니지드 DB, 별도 프로비저닝 필요)
```

빌드/설치 커맨드는 `vercel.json`에 명시되어 있으며, DB 프로비저닝·마이그레이션 실행·환경변수 설정 등 실제 배포 절차는 **[DEPLOY.md](./DEPLOY.md)**에 단계별로 정리했습니다. 로컬 Postgres는 개발 편의를 위해 Docker 컨테이너로 띄우고 있으나, 이는 저장소에 포함된 배포 설정이 아니라 로컬 실행 방법의 일부입니다.

## ⚙️ 로컬 실행 방법

```bash
# 0. 저장소 클론
git clone https://github.com/gajigaji04/Shogi_Dojo.git
cd Shogi_Dojo

# 1. 로컬 PostgreSQL 준비 (이미 사용 중인 Postgres가 있다면 생략 가능)
docker run -d --name shogi-postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=shogi_dojo \
  -p 5433:5432 postgres:16-alpine

# 2. 백엔드
cd server
cp .env.example .env        # DATABASE_URL을 위 컨테이너 기준으로 채우기 (아래 환경변수 표 참고)
npm install
npx prisma migrate dev --name init
npm run seed                 # 공지사항 시드 데이터 (선택)
npm run dev                  # http://localhost:8787

# 3. 프론트엔드 (새 터미널, 저장소 루트에서)
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173

# 4. 테스트
npm test                     # Vitest, 쇼기 규칙 엔진 73개 테스트
```

## 🔑 환경변수

### 루트 `.env` (`.env.example` 기준)

```env
# 로컬 개발 시 백엔드(server/, 기본 포트 8787) 주소.
# Vercel에 배포할 때는 비워둡니다 — 프론트엔드와 /api/*가 같은 도메인에서
# 서빙되므로, 비워두면 상대 경로(same-origin)로 요청합니다.
VITE_API_URL=http://localhost:8787
```

### `server/.env` (`server/.env.example` 기준)

```env
# PostgreSQL 연결 문자열
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# JWT 서명에 사용하는 비밀키. 반드시 충분히 긴 임의의 문자열로 교체할 것.
JWT_SECRET="change-me-in-production"

# 백엔드 서버 포트 (로컬 개발용, Vercel에서는 사용되지 않음)
PORT=8787

# CORS 허용 origin (프론트엔드 배포/개발 주소)
CORS_ORIGIN="http://localhost:5173"
```

실제 값(특히 `JWT_SECRET`, `DATABASE_URL`)은 이 문서나 저장소 어디에도 커밋하지 않습니다.

## 🧪 테스트

- **테스트 러너**: Vitest (`npm test` → `vitest run`)
- **범위**: `src/game/__tests__/` 하위 9개 파일, 총 73개 테스트 — **쇼기 규칙 엔진에 한정**되어 있습니다.
  - 기물별 이동 규칙(보병~비차, 성駒 포함)
  - 성(成り) 가능/강제 조건
  - 持ち駒 드롭 규칙(二歩, 行き所のない駒, 打ち歩詰め)
  - 체크/체크메이트, 핀(pin)으로 인한 자충수 방지
  - 千日手 무승부 및 連続王手의 千日手 반칙패
  - `gameReducer` 전체 플로우(이동/드롭/성/기권/재시작)
  - 튜토리얼 대국 스크립트의 합법성
  - KIF 파서(토큰 단위 파싱 + 실제 대국 재구성)
  - 미니맥스 CPU 엔진(항상 합법수 반환, 공짜 기물은 반드시 포획, 외통수 1수 탐색)
- **없는 것**: React 컴포넌트 테스트(React Testing Library 등), 백엔드 API에 대한 자동화된 통합 테스트는 없습니다. 온라인 대전·회원가입 등 백엔드가 관여하는 흐름은 개발 과정에서 Playwright로 수동 스크립트를 작성해 검증했으나, 이는 저장소에 포함된 자동화 테스트가 아니라 일회성 확인용이었습니다.

## 📈 성능 및 개선

현재 별도의 성능 최적화(캐싱, 코드 스플리팅 수동 설정, DB 인덱스 튜닝 등)를 목적으로 추가한 작업은 없습니다. 실제 적용된 것과 향후 방향은 다음과 같습니다.

- **적용된 것**
  - `Game.player1Id` / `player2Id` / `status`에 Prisma `@@index` 지정 — 내 대국 목록/매칭 조회 시 조건절에 자주 쓰이는 컬럼
  - CPU 엔진의 시간 예산 기반 탐색(고정 depth가 아님)으로 난이도가 올라가도 응답 시간이 예측 가능한 범위를 벗어나지 않도록 제한
  - 온라인 대전에서 내가 직접 둔 수는 폴링을 기다리지 않고 API 응답을 즉시 반영(다음 폴링 주기까지 기다리는 지연 제거)
- **향후 개선 방향**
  - CPU 탐색을 Web Worker로 분리해 최상 난이도(최대 1.4초)에서도 메인 스레드가 멈추지 않도록 개선
  - Vite의 기본 번들링 외에 라우트 단위 코드 스플리팅(`React.lazy`) 적용 여부 검토

## 🔮 향후 개선 계획

코드에 TODO/FIXME 주석은 없었지만, 구현 과정에서 의도적으로 범위를 좁힌 부분들입니다.

- **매칭 시스템 고도화**: 현재는 대기열에 먼저 들어온 상대와 즉시 매칭 — 레이팅(Elo 등) 기반 매칭 없음
- **기보 포맷 확장**: KIF만 지원하며 KI2/CSA/USI는 미지원(다만 `notation/` 디렉터리 구조상 파서를 추가하는 방식으로 확장 가능하도록 설계됨)
- **관전 기능**: 진행 중인 온라인 대국을 제3자가 관전하는 기능 없음
- **랭킹/시즌**: 전적(승/패/무)만 제공하고 순위·시즌 개념 없음
- **모바일 UX 세부 개선**: 반응형 자체는 되어 있으나, 좁은 화면에서의 터치 조작 디테일은 추가로 다듬을 여지가 있음
- **CPU 탐색 Web Worker 분리**: 위 성능 섹션 참고

## 👤 개발 정보

- **개발 인원**: 1인 개인 프로젝트
- **개발 기간**: 2026.08 ~ (저장소 커밋 이력 기준 2026-08-08부터)
- **담당 영역**: 기획, 디자인, Frontend, Backend, Database, 배포 설정까지 전 영역 단독 진행
- **인프라 계정/실배포**: 확인 필요 (Vercel/DB 프로바이더 계정 연결 및 실제 라이브 배포는 `DEPLOY.md` 절차에 따라 별도 진행 필요)

## 📝 회고

**기억에 남는 지점**

규칙 엔진을 프레임워크와 완전히 분리해둔 덕분에, 개발 도중 온라인 대전 아키텍처를 WebSocket에서 HTTP 폴링으로 통째로 바꾸는 큰 변경이 있었는데도 쇼기 규칙 코드 자체는 한 줄도 건드릴 필요가 없었습니다. "당장 필요하지 않아 보이는 분리"에 투자한 게 나중에 실제로 도움이 된 경험이었습니다.

打ち歩詰め, 連続王手의 千日手처럼 문서로만 봐서는 애매한 규칙들을 직접 테스트 케이스로 만들어보면서, "그럴듯하게 동작하는 것처럼 보이는 구현"과 "실제로 규칙을 만족하는 구현" 사이에 생각보다 큰 차이가 있다는 것을 여러 번 확인했습니다. 특히 千日手 테스트가 예상과 다른 시점에 끝나버린 경험은, 내가 짠 테스트 시나리오가 항상 내 예상대로 흘러가지 않는다는 걸 다시 깨닫게 해줬습니다.

**부족했던 부분**

테스트가 규칙 엔진에만 집중되어 있어서, React 컴포넌트나 백엔드 API 자체에 대한 자동화된 테스트는 없습니다. 온라인 대전처럼 여러 컴포넌트가 얽힌 기능은 개발 중 수동으로 확인한 시나리오에 의존했는데, 이 부분을 저장소에 남는 자동화된 테스트로 만들어두지 못한 것이 아쉽습니다.

**다음에 하고 싶은 것**

CI 파이프라인을 붙여서 PR마다 테스트·타입체크가 자동으로 돌게 만들고, 백엔드 라우트에 대한 최소한의 통합 테스트를 추가하는 것을 다음 목표로 생각하고 있습니다.

## 📄 License

[MIT](./LICENSE) © gajigaji04
