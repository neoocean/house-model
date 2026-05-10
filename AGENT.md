# AGENT.md

> ⚠️ **공개 GitHub repo (`house-model`)** — 본 디렉토리의 모든 변경은 public 으로 미러됩니다.
> 단지명·동·호수·주소·소유자·시공사·거래처·금액·외부 첨부 파일명 등 **신상 식별 정보를 어떤 파일에도 절대 추가하지 마세요**. 자세한 정책: [PRIVACY.md](./PRIVACY.md).
>
> Agent SDK / agents.md 표준 컨텍스트 파일.
> Claude Code 의 [CLAUDE.md](./CLAUDE.md) 와 동일한 정보를 담는다 — 본 파일을 정본(canonical) 으로 두고 변경 시 양쪽을 함께 갱신할 것.
> 더 자세한 기술 문서는 [DESIGN.md](./DESIGN.md), 사람용 요약은 [MEMORY.md](./MEMORY.md).

## 프로젝트 한 줄 요약
12 m × 6.6 m 평면(한 가구 거주용) 인테리어 계획 검토용 단일 HTML Three.js 뷰어. 빌드 단계 없음 — `index.html` 을 브라우저로 열기만 하면 된다.

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html` (~2.5 K 줄) | HTML 셸 + UI/CSS + 인라인 JS (씬·`LIGHTING`·`PAL`·레이아웃·헬퍼·텍스처(`TILE_CONFIG`/`WALLPAPER_CONFIG`)·`WALLPAPER_OVERRIDES`·바닥·천장·외벽·내벽·걸레받이(`mSkirting` 전역)·문(swing/flap/slide)·라벨·조명·벽지·키친핏·외부문·신발장·**영림 3연동 중문**·어셔션 시각 띠·카메라·컨트롤·디버그·애니메이션) |
| `outlets.js` (~200 줄) | `OUTLETS` 26 항목 + `_outlets[]` 레지스트리 + `buildOutlet` IIFE (한국 220V Type-F, 2구 세로) + `_outletStats()` 콘솔 헬퍼 |
| `powerplan.js` (~190 줄) | 전원 계획 모드 (`2` 키 토글, 이전 `1`): `setPowerPlanMode` / `_initPowerPlanCache` / `_initOutletOutlines` / `_buildPpVisIdxs` |
| `furniture.js` (~2.1 K 줄) | `FURN_REGISTRY` + `FURN_META` (27 개 메타) + `FURN_CATALOG` (13 종 템플릿) + 가구 IIFE 27 개 |
| `minimap.js` (~1.4 K 줄) | 미니맵 IIFE — `ROOMS`/`WALLS`/`DOORS`/`FURNITURE`/`WINDOWS` 데이터 + 정적 캔버스 캐시 + 동적 배지 (cat 필드, PP 모드 시 wall 만 + hover-spread 콜아웃) + SHIFT-aim 식별/치수 라벨 (PP 모드: 콘센트+벽 한정) + init-time 어셔션 (§M/§P/§U/§CC) + 콘솔 헬퍼 (`_inspect`/`_gap`/`_listRoom`) |
| `vendor/three.min.js` | Three.js 0.150.1 UMD (벤더링됨) |
| `POWERPLAN.md` | 전원 콘센트 배치 인덱스 (방별 표 + 표준 마운트 높이 + PP 모드 동작) |

## 실행 / 검증
- 실행: 브라우저로 `model/index.html` 열기. 빌드 단계 없음.
- 단축키: `Space` (모드 토글), `WASD` (이동), `Q`/`E` (위/아래 또는 눈높이), `R` (카메라 리셋), `SHIFT` (조준 라벨+치수), **`2` (전원 계획 모드 토글, 이전 `1`)**, **`1` (2026-05-08 미팅 결정사항 토글 — 예약, 핸들러 미등록)**, **`M` (미니맵 표시/숨김)**.
- 디버그 모드: `index.html?debug` — 50 cm 그리드 + X/Z 축 + 가구 BBox 외곽선 + `window._mmData` 노출.
- 레이아웃 변형: `?variant=<name>` (인프라만 — 호출 사이트 분기 추가 시 유효).
- 콘솔 헬퍼:
  - `_inspect(48)` 또는 `_inspect('FURN#48')` — 가구 메타 조회
  - `_gap(48, 49)` — 두 가구 BBox 간 xz 클리어런스 (cm)
  - `_listRoom('욕실')` — 한 방의 가구 목록
  - `_outletStats()` — OUTLETS 통계 (total / totalGangs / byRoom / byKind)
- init-time 어셔션 (실패 시 콘솔 경고 + 화면 상단 빨간 띠 `#assert-banner`):
  - `[M]`/`[P]`/`[U]`/`[CC]` (minimap.js) — 인덱스 일관성·spec↔배열·충돌
  - `[O]` (outlets.js) — OUTLETS face/gangs/좌표/kind 범위 검사
  - `[PP]` (powerplan.js, 2 키 토글 시) — _ppFurnsToHide 범위 / outlines = outlets
  - 모두 `console.assert` / `console.warn` monkey-patch 로 자동 띠 표시.

## 안정 식별자 시스템
모든 객체는 글로벌 `@TYPE#NN` 번호로 참조한다 (배지 = ROOMS+DOORS+FURN+i 누적합):
- `@ROOM#1..15` (방 11 + PD/chase/기둥 4)
- `@DOOR#16..51` (36) — 회전형 31 + 신발장 양문 2 + 영림 3연동 중문 패널 3
- `@FURN#47..73` (27, FURN_META id 기준 — 안정. 현재 미니맵 배지는 가구 52..78)
- 벽 (43) — 현재 미니맵 배지 79..121
- 창문 (5) — 현재 미니맵 배지 122..126

⚠️ **배지 시프트**: DOORS / FURNITURE 추가 시 후속 카테고리 배지 자동 +N 시프트. 코드 anchor `@FURN#NN` 은 FURN_META id 로 안정하나 미니맵 배지는 다를 수 있음. 사용자가 옛 CL 의 배지 번호 (`벽 96` 등) 를 참조 시 라벨 텍스트로 grep 권장.

“@FURN#48” 같은 식으로 grep 하면 `FURN_META`, `FURNITURE[]`, IIFE 섹션 헤더 모두에서 정확 매칭.

## 좌표·단위 컨벤션
- 단위: m. `mm(v)` / `cm(v)` 헬퍼로 변환 표기 가능.
- 그리드 상수 (`index.html` LAYOUT CONSTANTS):
  - X: `xL=0, xBal=1.5, xKit=5.1, xBR=7.8, xHall=10.5, xR=12`
  - Z: `zT=0, zM1=2.7, zM2=4.2, zBath=4.8, zB=6.6`, `zLR2=3.5` (침실 2 상단 벽)
  - 일반: `CH=2.4`, `WT=0.12`, `FT=0.05`, `DW=0.9`, `DH=2.05`

## 자주 받는 요청과 처리법
| 요청 | 단일 수정 위치 |
|---|---|
| 가구 X 의 치수 변경 | `FURN_META[id].size` + (마이그레이션된 47/48/49 는) `defineFurniture` spec; 미마이그레이션은 IIFE 내부 const + `FURNITURE_BBOX`도 동기 |
| 가구 위치 이동 | `FURN_META[id].pos` + `FURNITURE[idx]` (xz) + 빌더 |
| 조명 톤·강도 | `LIGHTING.rooms[i]` 한 곳 |
| 천장 조명 마커 위치 | `CEILING_LIGHTS[i]` 한 곳 (시각 전용 fixture, 발광 X — 위치 검토용). kind: `flush`/`panel`/`wet`. |
| 바닥 타일 톤 | `TILE_CONFIG.baseColors` |
| 벽지 톤 (전체) | `WALLPAPER_CONFIG.baseColor` |
| 벽지 (방별) | `WALLPAPER_OVERRIDES['방이름']` + 빌더 측 적용 |
| 우드톤 가구 일괄 변경 | `PAL.wood.*` (마이그레이션된 가구만) |
| 신규 가구 추가 | `defineFurniture` 권장 + `FURN_META[id]` + `FURNITURE[]` + `FURNITURE_BBOX[]` + (인터랙티브 도어) `_doors.push` + `DOORS[]` |
| 신규 미닫이 도어 추가 | `_doors.push({kind:'slide', linkGroup:'<id>', pivot, doorMesh, slideAxis, slideOrigin, slideOpen, isOpen})` + `DOORS[]` 동기 (assertion §M 준수). doorMesh 는 패널 Group — `_toggleDoorAtNDC` 가 recursive intersect + 부모 체인으로 매칭. linkGroup 일치하는 모든 패널이 동기 토글. |
| 미니맵 배지 충돌 식별 | 마우스를 미니맵 위에 호버 — 주변 36 px 안 배지가 64+ px 원에 펼쳐짐 (hover-spread 콜아웃, CL 50276). |
| 가구 후보 카탈로그 | `FURN_CATALOG` (CSV 후보 + 표준 13 종) |
| 벽 위치 이동 | `DESIGN.md §3.7.1` 체크리스트 9 단계 |
| 측정값 반영 | 해당 위치 + `@MEASURED YYYY-MM-DD` 마커 |

자세한 체크리스트: `DESIGN.md §3.7 변경 시 주의점`.

## 측정 출처 마커
- `@MEASURED YYYY-MM-DD` — 실측값. 함부로 수정 금지.
- `@ESTIMATE` — 설계 추정/표준치/스타일 참조.
- `@SCALED` — 의도적 비례 조정.

## 동작 보존이 핵심 제약
모든 변경은 **동작 비트-동일** 을 전제로 한다. 어셔션이 인덱스 일관성을 자동 검증하지만 시각·UX 회귀는 사용자 피드백에 의존. 큰 변경 시 디버그 모드(`?debug`) 로 시각 확인을 요청.

## 워크스페이스 / VCS
- 본 repo 는 **public GitHub** (`house-model`) 에 미러됨. push 전 [PRIVACY.md](./PRIVACY.md) 체크리스트 검토 필수.
- 사용자 환경에 따라 GitHub 직접 작업 또는 별도 비공개 VCS 에서 미러 가능.
- 새 머신에서 시작할 때: 저장소 동기 후 작업.

### Perforce → GitHub 자동 미러
P4 워크스페이스에서 작업 시 **매 `p4 submit` 직후** 다음 호출:

```bash
~/bin/mirror-to-github.sh
```

스크립트가 rsync 미러 + git-only 파일 복구 + 민감 키워드 audit (`~/.house-model-sensitive-keywords.txt`) + commit (P4 CL 번호·설명 자동 부기) + push 수행. 키워드 차단 시 exit 2 — 수동 검토 필요. 자세한 정책은 [CLAUDE.md](./CLAUDE.md) "Perforce → GitHub 자동 미러 워크플로우" 참조.

## 외부 자료
원본 평면도 이미지·계약 문서·실측 사진 등 식별 가능한 자료는 본 repo **외부** 비공개 작업 디렉토리에만 보관. 본 repo (public) 에 파일명·경로·내용 일체 노출 금지. 상세 정책: [PRIVACY.md](./PRIVACY.md).

## 변경 후 권장 검증
1. 브라우저 새로고침 → 콘솔에 `[M]`/`[P]`/`[U]`/`[CC]` 경고 없는지 확인.
2. SHIFT + 마우스 조준으로 라벨/치수가 의도대로 갱신되는지 확인.
3. `?debug` 로 가구 BBox 가 메시와 정렬됐는지 시각 확인.
4. 1인칭 모드(`Space` 키)로 동선/공간감 확인.
