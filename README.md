# house-model

12 m × 6.6 m 평면(한 가구 거주용) 의 인테리어 변경안을 검토하기 위한 단일 HTML Three.js 뷰어.
브라우저로 [`index.html`](./index.html) 을 열면 바로 동작 — 빌드 단계 없음.

> 본 repo 는 **public**. 단지명·계약자·금액·외부 첨부 파일명 등 신상 식별 정보는 절대 포함하지 않습니다. 정책: [PRIVACY.md](./PRIVACY.md).

## 라이브 데모

GitHub Pages 활성 시: `https://neoocean.github.io/house-model/`
(또는 로컬에서 `index.html` 더블클릭).

## 주요 기능

- **두 카메라 모드** (`Space` 토글): 부감 / 1인칭
- **인터랙티브 도어** ~31 개 (클릭으로 열림/닫힘 보간)
- **SHIFT-aim 라벨** — 마우스/크로스헤어로 가리킨 객체의 식별 번호 + 너비/길이/높이 cm 표시
- **콘센트 하이라이트** — SHIFT-aim 으로 벽 콘센트를 가리키면 노란 외곽선
- **미니맵** (좌하단) + 100+ 개 번호 배지 (방·문·가구·벽·창)
- **디버그 모드** (`?debug`) — 50 cm 그리드 + X/Z 축 + 가구 BBox 외곽선
- **콘솔 헬퍼** — `_inspect(48)`, `_gap(48, 49)`, `_listRoom('욕실')`

## 단축키

| 키 | 동작 |
|---|---|
| `Space` | 프리/1인칭 모드 토글 |
| `WASD` | 이동 |
| `Q`/`E` | 위/아래 비행 (프리) / 눈높이 ±1 cm (1인칭) |
| `R` | 카메라 리셋 (프리) |
| `1` / `Numpad1` | 가구 일괄 표시/숨김 토글 |
| `SHIFT` | 마우스/크로스헤어 조준 객체의 식별 라벨 + W/D/H cm |

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 메인 HTML + UI/CSS + 인라인 JS (씬·재료·텍스처·바닥·벽·문·조명·콘센트·카메라·컨트롤·디버그·animate) |
| `furniture.js` | `FURN_REGISTRY` + `FURN_META` (27 개) + `FURN_CATALOG` + 가구 IIFE 27 개 |
| `minimap.js` | 미니맵 IIFE — 데이터 배열 + 정적 캔버스 캐시 + SHIFT-aim 식별/치수 라벨 + 콘솔 헬퍼 |
| `vendor/three.min.js` | Three.js 0.150.1 UMD ([MIT 라이선스](./vendor/THREE_LICENSE)) |
| `DESIGN.md` | 권위 기술 문서 — 의도/동작/현재 상태/시행착오 |
| `MEMORY.md` | 사람용 프로젝트 메모 |
| `CLAUDE.md`, `AGENT.md` | LLM 에이전트 컨텍스트 |
| `PRIVACY.md` | **공개·비공개 정책 (commit 전 필수 점검)** |

## 기술

- Three.js 0.150.1 (UMD, `vendor/three.min.js` 에 동봉)
- 단일 HTML — Node.js / 빌드 도구 / 패키지 매니저 불필요
- 클래식 `<script>` 4 개 블록 (vendor → 인라인 → furniture.js → 인라인 → minimap.js → 인라인) 로 글로벌 스코프 공유

## 라이선스

- 본 repo 자체 코드: [GPL-3.0](./LICENSE)
- 동봉된 Three.js: [MIT](./vendor/THREE_LICENSE) (귀속 보존)

## 기여 / 변경 시

1. [`PRIVACY.md`](./PRIVACY.md) 의 commit 금지 정보 목록 점검
2. 동작 비트-동일 보존 (어셔션 §M/§P/§U/§CC 가 자동 검증)
3. `?debug` 로 시각 회귀 확인 권장
4. [`DESIGN.md`](./DESIGN.md) 와 코드 동시 갱신
