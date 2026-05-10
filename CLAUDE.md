# CLAUDE.md

> ⚠️ **공개 GitHub repo (`house-model`)** — 본 디렉토리의 모든 변경은 public 으로 미러됩니다.
> 단지명·동·호수·주소·소유자·시공사·거래처·금액·외부 첨부 파일명 등 **신상 식별 정보를 어떤 파일에도 절대 추가하지 마세요**. 자세한 정책: [PRIVACY.md](./PRIVACY.md).
>
> Claude Code 가 본 디렉토리에서 작업할 때 자동 로드하는 프로젝트 컨텍스트.
> 더 자세한 기술 문서는 [DESIGN.md](./DESIGN.md), 사람용 요약은 [MEMORY.md](./MEMORY.md), 에이전트 SDK 표준 컨텍스트는 [AGENT.md](./AGENT.md) 를 참조.

## 프로젝트 한 줄 요약
12 m × 6.6 m 평면(한 가구 거주용) 인테리어 계획 검토용 단일 HTML Three.js 뷰어. 빌드 단계 없음 — `index.html` 을 브라우저로 열기만 하면 된다.

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html` (~2.5 K 줄) | HTML 셸 + UI/CSS + 인라인 JS (씬·`LIGHTING`·`PAL`·레이아웃·헬퍼·텍스처(`TILE_CONFIG`/`WALLPAPER_CONFIG`)·`WALLPAPER_OVERRIDES`·바닥·천장·외벽·내벽·걸레받이(`mSkirting` 전역)·문(swing/flap/slide)·라벨·조명·벽지·키친핏·외부문·신발장·**영림 3연동 중문**·어셔션 시각 띠 + monkey-patch·카메라·컨트롤·2 키/M 키 안내·디버그·애니메이션) |
| `outlets.js` (~165 줄) | `OUTLETS` 배열 (26 항목, 위치/면방향/구수/방수/라벨) + `_outlets[]` 레지스트리 + `buildOutlet` IIFE (한국 220V Type-F: 원형 리세스 컵 ⌀46mm + 둥근 핀 홀 2개 ⌀4.4mm 19mm 가로 간격, 2구만 세로 배치). |
| `furniture.js` (~2.1 K 줄) | `FURN_REGISTRY` + `FURN_META` (27 개 메타) + `FURN_CATALOG` (13 종 템플릿) + 가구 IIFE 27 개 |
| `minimap.js` (~1.4 K 줄) | 미니맵 IIFE — `ROOMS`/`WALLS`/`DOORS`/`FURNITURE`/`WINDOWS` 데이터 + `WINDOWS_BBOX`/`FURNITURE_BBOX`/`WINDOWS_H`/`WINDOWS_Y0` + 정적 캔버스 캐시 (타이틀만) + 동적 배지 layer (hover-spread 콜아웃 + cat 필드 — PP 모드 시 wall 만 표시) + SHIFT-aim 식별/치수 라벨 (PP 모드: 콘센트 + 벽 한정) + init-time 어셔션 (§M/§P/§U/§CC) + 콘솔 헬퍼 (`_inspect`/`_gap`/`_listRoom`) |
| `outlets.js` (~210 줄) | `OUTLETS` 26 항목 + `gangLayout()` + `FACE` lookup + `buildOutlet` IIFE (한국 220V Type-F, 2구 세로) + `[O]` 데이터 init-time 검증 + `_outletStats()` 콘솔 헬퍼 |
| `powerplan.js` (~200 줄) | 전원 계획 모드 (2 키 토글, 이전 1) — `setPowerPlanMode` / `_initPowerPlanCache` (isPreserved 헬퍼 + 도어 분류 + 휴리스틱 상수 hoist) / `_initOutletOutlines` / `_buildPpVisIdxs` / **`_applyOutletView`** (CL 50995 추출, 미팅 모드 공유) / `[PP]` 어셔션 |
| `meetingmode.js` (~70 줄) | 5/8 미팅 결정사항 모드 (1 키 토글, CL 50995) — `setMeetingMode` 가 `_applyOutletView` 호출. PP 모드와 mutually exclusive. 향후 조명·난방·디딤판 등 시각화 추가 예정. |
| `vendor/three.min.js` | Three.js 0.150.1 UMD (벤더링됨) |
| `DESIGN.md` | 권위 기술 문서 — 항목 A~T + U/CC/W/Z/Y/AA/V/X/DD/BB + §3.6.8 (PP/outlets/Type-F 리팩토링) 적용 이력 |
| `POWERPLAN.md` | 전원 콘센트 배치 인덱스 (방별 표 + 표준 마운트 높이 + PP 모드 동작 + 어셔션 카탈로그 + CL 이력). |
| `MEMORY.md` | 사람용 프로젝트 기억 (계약·일정·자재 후보 등) |
| `AGENT.md` | Agent SDK 표준 컨텍스트 (본 파일과 거의 동일 내용) |

## 실행 / 검증
- 실행: 브라우저로 `model/index.html` 열기. 빌드 단계 없음.
- 단축키:
  - `Space` — 프리/1인칭 토글, `WASD` 이동, `Q`/`E` 위/아래 또는 눈높이 ±1 cm, `R` 카메라 리셋
  - `SHIFT` — 마우스/크로스헤어 조준 객체 식별 + 치수 (W/D/H cm) 라벨
  - **`2`** — **전원 계획 모드** 토글: 신발장·욕실 가구 외 전부 hide + 콘센트 plate 노란 외곽선 + 미니맵 벽 번호만 + 콘센트 호버 시 라벨에 높이(cm) 추가 (SHIFT 시 벽 번호도 표시). (이전 `1`, CL 50974 에서 변경.)
  - **`1`** — **5/8 미팅 결정사항 모드** 토글 (CL 50995): 첫 시각화는 `2` 키 PP 모드와 동일 효과 (가구 hide + 콘센트 outline). 추후 조명·난방 분배기·난방 컨트롤러 위치/수량 시각화 단계적 추가 예정. PP 모드와 mutually exclusive — 한 모드 켜면 다른 모드 자동 종료. 녹색 📋 배지로 PP 의 주황 🔌 배지와 구분.

- **모바일 환경** (CL 50979, 감지: `'ontouchstart' in window && innerWidth ≤ 1024`):
  - UI 안내(`#ui`) + 미니맵(`#minimap`, `#minimap-legend`) 숨김 (키보드 사용 불가).
  - **한 손가락 드래그** → WASD 대체 카메라 이동 (가상 조이스틱, ±80px = 100% 입력).
  - **두 손가락 핀치** → 시선 방향 전진/후진 (휠 핸들러와 동일 PINCH_SPEED=0.012).
  - **한 손가락 짧은 탭** (이동<10px + 시간<300ms) → 문 토글 (`_toggleDoorAtNDC`).
  - 데스크톱은 영향 없음 (`IS_MOBILE` false → 모든 모바일 코드 경로 비활성).
  - **`M`** — 미니맵 표시/숨김
- 디버그 모드: `index.html?debug` — 50 cm 그리드 + X/Z 축 + 가구 BBox 외곽선 + `window._mmData` 노출.
- 레이아웃 변형: `index.html?variant=<name>` (현재는 인프라만 — 호출 사이트에 분기 추가 시 유효).
- 콘솔 헬퍼 (디버그 모드 무관 항상 노출):
  - `_inspect(48)` 또는 `_inspect('FURN#48')` — 가구 메타 조회
  - `_gap(48, 49)` — 두 가구 BBox 간 xz 클리어런스 (cm)
  - `_listRoom('욕실')` — 한 방의 가구 목록
  - `_outletStats()` — OUTLETS 통계 (total / totalGangs / byRoom / byKind)
- init-time 어셔션 (실패 시 콘솔 경고 + **화면 상단 빨간 띠** `#assert-banner`):
  - `[M]`/`[P]`/`[U]` 인덱스 일관성 / `[CC]` 가구-가구·가구-벽 충돌 (minimap.js)
  - `[O]` OUTLETS face/gangs/좌표/kind 범위 검사 (outlets.js)
  - `[PP]` _ppFurnsToHide 범위 / _ppOutlines = _outlets 일치 (powerplan.js, 2 키 토글 시)
  - 모두 `console.assert` / `console.warn` monkey-patch 로 자동 띠 표시 (CL 50412).

## 안정 식별자 시스템
모든 객체는 글로벌 `@TYPE#NN` 번호로 참조한다. 미니맵 배지 = ROOMS+DOORS+FURN+i 누적합:
- `@ROOM#1..15` (방 11 개 + PD/chase/기둥 4 개)
- `@DOOR#16..51` (36 개) — 회전형 31 + 신발장 양문 2 + 영림 3연동 중문 패널 3 (kind:'slide')
- `@FURN#47..73` (27 개) — `FURN_META[id]` 의 id 키. 안정 식별자.
- 벽 (43 개, 미니맵 배열만) — 현재 배지 79..121
- 창문 (5 개) — 현재 배지 122..126

⚠️ **배지 시프트 주의**: DOORS 또는 FURNITURE 추가 시 후속 카테고리 배지 자동 시프트. 코드 anchor `@FURN#47` 은 FURN_META id 47 을 가리키나 미니맵에 표시되는 배지는 "가구 52" (=15+36+0+1, 현재). 옛 CL 의 "벽 96" 같은 표현이 현재 다른 벽일 수 있으므로 가능하면 라벨 텍스트 ("배관 기둥 옆 corridor 벽" 등) 로 grep.

LLM 은 “@FURN#48” 같은 식으로 grep 하면 `FURN_META`, `FURNITURE[]`, IIFE 섹션 헤더 모두에서 정확 매칭.

## 좌표·단위 컨벤션
- 단위: m. mm/cm 변환은 `mm(v)` / `cm(v)` 헬퍼 (`v*0.001` / `v*0.01`).
- 그리드 상수 (`index.html` LAYOUT CONSTANTS):
  - X: `xL=0, xBal=1.5, xKit=5.1, xBR=7.8, xHall=10.5, xR=12`
  - Z: `zT=0, zM1=2.7, zM2=4.2, zBath=4.8, zB=6.6`, `zLR2=3.5` (침실 2 상단 벽)
  - 일반: `CH=2.4` (천장), `WT=0.12` (벽 두께), `FT=0.05` (바닥 슬라브), `DW=0.9 / DH=2.05` (표준 문)

## 자주 받는 요청과 처리법
| 요청 | 단일 수정 위치 |
|---|---|
| 가구 X 의 치수 변경 | `FURN_META[id].size` + (마이그레이션된 47/48/49 는) `defineFurniture` spec; 미마이그레이션은 IIFE 내부 const + `FURNITURE_BBOX`도 동기 |
| 가구 위치 이동 | `FURN_META[id].pos` + `FURNITURE[idx]` (xz) + 빌더 |
| 조명 톤·강도 | `LIGHTING.rooms[i]` 한 곳 |
| 천장 조명 마커 위치 | `CEILING_LIGHTS[i]` 한 곳 (시각 전용, 발광 X — 위치 검토용). kind: `flush`/`panel`/`wet`. |
| 바닥 타일 톤 | `TILE_CONFIG.baseColors` |
| 벽지 톤 (전체) | `WALLPAPER_CONFIG.baseColor` |
| 벽지 (방별) | `WALLPAPER_OVERRIDES['방이름'] = { baseColor:..., ... }` 후 빌더 측 적용 |
| 우드톤 가구 일괄 변경 | `PAL.wood.*` (마이그레이션된 가구만; 미마이그레이션은 IIFE 인라인) |
| 신규 가구 추가 | `defineFurniture` 권장 + `FURN_META[id]` + `FURNITURE[]` + `FURNITURE_BBOX[]` + (인터랙티브 도어) `_doors.push` + `DOORS[]` |
| 신규 미닫이 도어 추가 | `_doors.push({kind:'slide', linkGroup:'<id>', pivot, doorMesh, slideAxis, slideOrigin, slideOpen, isOpen})` + `DOORS[]` 동기. doorMesh 는 패널 Group — `_toggleDoorAtNDC` 가 recursive intersect + 부모 체인 매칭. linkGroup 일치하는 모든 패널 동기 토글. animate 루프 `pivot.position[slideAxis]` 보간 (회전형은 `pivot.rotation[axis]`). |
| 콘센트 추가/이동/제거 | **`outlets.js` 의 `OUTLETS` 배열** 만 수정. 형식 `{x, y, z, face, gangs, kind?, label}`. `face` = N/S/E/W (콘센트가 향하는 방향). 자세한 가이드는 [`POWERPLAN.md`](./POWERPLAN.md). 추가 후 `_outletStats()` 콘솔 헬퍼로 통계 확인. |
| 콘센트 형태 변경 (모양·치수·돌출) | `outlets.js` buildOutlet IIFE 의 상수 (`W_PER_GANG`, `HEIGHT`, `PLATE_T`, `CLEARANCE`, `CUP_R`, `PIN_R`, `PIN_DX`, `Z_CUP_EPS`, `Z_PIN_EPS`) + `gangLayout(gangs)` 함수 (gangs → {W,H,positions[]}) + `FACE` lookup table. 한국 220V Type-F 표준 — 1·3·4구는 가로, 2구는 세로. |
| PP 모드 동작 변경 | **`powerplan.js`** 의 `_initPowerPlanCache()` (분류 — outletSet/doorSet/structMats/_wpTex/bboxes + isPreserved 헬퍼 + XZ_SLACK/Y_TOL/SIZE_BUF/DOOR_SLACK), `setPowerPlanMode(on)` (visIdxs / mesh visibility), `minimap.js _updateAimLabel` (PP+SHIFT 시 콘센트+벽 한정 — `PP_AIM_TYPES_*` set). [`POWERPLAN.md`](./POWERPLAN.md) §"PP 모드 동작 요약". |
| 미니맵 배지 식별 | 마우스를 미니맵 위에 hover — 주변 36 px 안 배지가 64+ px 원에 펼쳐져 콜아웃 표시 (밀집 영역 disambiguation, CL 50276). |
| 가구 후보 카탈로그 조회 | `FURN_CATALOG` (제크리/이안빅/블룸 옷장, LG DIOS 가전, 데스커 책장/책상 등) |
| 벽 위치 이동 | `DESIGN.md §3.7.1` 체크리스트 9 단계 (3D 벽 + 벽지 + 걸레받이 + 바닥 + 천장 + 미니맵 ROOMS/WALLS + 인접 가구 + 벽 의존 문) |
| 측정값 반영 | 해당 위치 + 주석에 `@MEASURED YYYY-MM-DD` 마커 |

자세한 체크리스트: `DESIGN.md §3.7 변경 시 주의점`.

## 측정 출처 마커 컨벤션
- `@MEASURED YYYY-MM-DD` — 실측값. 함부로 수정 금지.
- `@ESTIMATE` — 설계 추정/표준치/스타일 참조.
- `@SCALED` — 의도적 비례 조정.

## 동작 보존이 핵심 제약
모든 변경은 **동작 비트-동일** 을 전제로 한다. 어셔션이 인덱스 일관성을 자동 검증하지만 시각·UX 회귀는 사용자 피드백에 의존. 큰 변경 시 디버그 모드(`?debug`) 로 시각 확인을 요청.

## 워크스페이스 / VCS
- 본 repo 는 **public GitHub** (`house-model`) 에 미러됨. push 전 [PRIVACY.md](./PRIVACY.md) 체크리스트 검토 필수.
- 사용자 환경에 따라 GitHub 직접 작업 또는 별도 비공개 VCS(Perforce 등) 에서 미러 가능.
- 새 머신에서 시작할 때: 저장소 동기 (`git pull` 또는 해당 VCS) 후 작업.

### Perforce → GitHub 자동 미러 워크플로우
**Perforce 워크스페이스에서 작업 시, 매 `p4 submit` 직후 다음 명령을 호출해 GitHub 미러를 갱신**:

```bash
~/bin/mirror-to-github.sh
```

이 스크립트가 다음을 수행:
1. P4 model/ → ~/repos/house-model rsync (`.git/`, `.p4*`, `.DS_Store`, `.claude/` 제외)
2. git-only 파일 복구 (LICENSE / README.md / .gitignore / vendor/THREE_LICENSE)
3. 민감 키워드 audit (`~/.house-model-sensitive-keywords.txt` 의 패턴이 staged diff 에 있으면 push 차단, 종료 코드 2)
4. 변경 발견 시 commit (P4 의 최신 CL 번호·설명을 메시지에 자동 부기) + push

**LLM 에이전트 의무**: P4 에 submit 한 직후 위 명령을 실행하지 않으면 GitHub 가 뒤처짐 — 모든 `p4 submit` 직후 호출.

키워드 audit 차단 시(exit 2): `cd ~/repos/house-model && git diff --cached` 로 검토 후 사용자 결정 따라 수동 commit & push 또는 스테이징 해제.

## 외부 자료
원본 평면도 이미지·계약 문서·실측 사진 등 식별 가능한 자료는 본 repo **외부** 비공개 작업 디렉토리에만 보관. 본 repo (public) 에 파일명·경로·내용 일체 노출 금지. 상세 정책: [PRIVACY.md](./PRIVACY.md).

## 변경 후 권장 검증
1. 브라우저 새로고침 → 콘솔에 `[M]`/`[P]`/`[U]`/`[CC]` 경고 없는지 확인.
2. SHIFT + 마우스 조준으로 라벨/치수가 의도대로 갱신되는지 확인.
3. `?debug` 로 가구 BBox 가 메시와 정렬됐는지 시각 확인.
4. 1인칭 모드(`Space` 키)로 동선/공간감 확인.
5. `2` 키로 전원 계획 모드 진입 — 신발장/욕실 가구 외 모두 사라지고 콘센트 외곽선·라벨이 의도대로 동작하는지 확인. `M` 키로 미니맵 토글.
