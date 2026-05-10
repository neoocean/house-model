# DESIGN.md — 아파트 3D 뷰어

> ⚠️ **공개 GitHub repo (`house-model`)** — 단지명·계약자·금액·외부 파일명 등 신상 식별 정보 추가 절대 금지. [PRIVACY.md](./PRIVACY.md) 참조.
>
> 본 문서는 `model/` 디렉토리의 현재 빌드 상태를 기록한다 (P4 CL 50402 기준 / PP 모드 정착 / outlets.js 분리).
> 코드 자체가 권위 자료이며, 본 문서는 그 의도·동작·구조를 빠르게 파악하기 위한 안내서다.
>
> **빌드 구성** (총 ~920 KB):
> - `index.html` — ~2 600 줄 / 132 KB. 메인 HTML + UI/CSS + 인라인 JS (씬·라이팅(`LIGHTING`)·재료(`PAL`/`mSkirting` 전역)·레이아웃·헬퍼·텍스처(`TILE_CONFIG`/`WALLPAPER_CONFIG`)·`WALLPAPER_OVERRIDES`·바닥·천장·외벽·내벽·걸레받이·문·라벨·조명·벽지·키친핏·외부문·신발장·영림 3연동 중문·**어셔션 시각 띠 + console.assert/warn monkey-patch**·카메라·컨트롤·M 키 미니맵 토글·디버그·애니메이션 루프). `_doors[]` 애니메이션 루프는 `axis` 필드(기본 `'y'` 스윙, `'x'`/`'z'` 플랩, `kind:'slide'` 미닫이) 분기 보간. **PP 모드 (2 키 토글, 이전 1) 는 powerplan.js 로 분리됨.**
> - `outlets.js` — ~210 줄 / 9 KB. `OUTLETS` 배열 (26 항목) + `_outlets[]` 레지스트리 + `gangLayout()` + `buildOutlet` IIFE. **한국 220V Type-F 형태**: 원형 리세스 컵 ⌀46mm + 둥근 핀 홀 2개 ⌀4.4mm 19mm 가로 간격. **2구만 세로 배치** (1/3/4구는 가로). 벽으로부터 돌출 ~37mm (CLEARANCE 35mm + plate 두께 1.5mm). 사용자 요청 (CL 50383) 으로 index.html 인라인 2 에서 분리, inline 1 직후 furniture.js 직전 로드. `_outletStats()` 콘솔 헬퍼 노출.
> - `powerplan.js` — ~200 줄. 전원 계획 모드 (2 키 토글, 이전 1, CL 50974). `setPowerPlanMode` / `_initPowerPlanCache` (분류 휴리스틱 + isPreserved 헬퍼 + doorSet 분류) / `_initOutletOutlines` / `_buildPpVisIdxs` / **`_applyOutletView`** (CL 50995 추출 — 미팅 모드와 공유) / Digit2 keydown 리스너. inline 2 직후 (모든 _doors push 완료 후) meetingmode.js 직전 로드.
> - `meetingmode.js` — ~70 줄. **5/8 미팅 결정사항 모드** (1 키 토글, CL 50995). `setMeetingMode` 가 `_applyOutletView(on)` 호출 + 자체 배지(`#meeting-badge`) 토글. PP 모드와 mutually exclusive (한 모드 켜면 다른 모드 자동 종료, 시각 효과는 합집합 전이에만 토글). 첫 시각화는 PP 와 동일 (가구 hide + 콘센트 outline) — 추후 조명·난방 분배기·난방 컨트롤러 등 단계적 추가 예정.
> - `furniture.js` — 2 127 줄 / 105 KB. `FURN_REGISTRY` + `FURN_META` (27 개) + `FURN_CATALOG` (13 종 템플릿) + 가구 IIFE 27 개 (드럼세탁기·소파·다이닝·자전거·침대·책상·책꽂이 3종·벽걸이 자전거·신발장·붙박이장·주방 4종(하부 앞/우, 상부 앞, **축소판 반투명 플랩 상부 우**)·욕실 위생기구·벽등).
> - `minimap.js` — ~1 400 줄 / 65 KB. 미니맵 IIFE (`ROOMS`/`WALLS`/`DOORS`/`FURNITURE`/`WINDOWS` 데이터 + `WINDOWS_BBOX`/`FURNITURE_BBOX`/`WINDOWS_H`/`WINDOWS_Y0` + 정적 레이어 캐시 + 번호 배지 (cat 필드, **PP 모드 시 wall 만 표시**) + SHIFT 치수 표시·콘센트 하이라이트·**PP 모드 SHIFT 시 콘센트+벽 한정 라벨** + 어셔션 §M/§P/§U/§CC + 콘솔 헬퍼 `_inspect`/`_gap`/`_listRoom`).
> - `vendor/three.min.js` — 600 KB. Three.js 0.150.1 (UMD, MIT). `vendor/THREE_LICENSE` 동봉.
> - `DESIGN.md` (본 문서) / `POWERPLAN.md` (전원 콘센트 배치 인덱스) / `MEMORY.md` / `CLAUDE.md` / `AGENT.md` / `PRIVACY.md` / `README.md` (GitHub 만).
>
> 빌드 단계 없음 — 브라우저에서 `index.html` 을 열기만 하면 된다.
>
> **GitHub 미러**: `https://github.com/neoocean/house-model` — Perforce → GitHub 자동 미러 스크립트 (`~/bin/mirror-to-github.sh`) 가 매 P4 submit 직후 호출되어 push 됨 (CL 번호·설명을 commit message 에 자동 부기, 민감 키워드 audit 차단 포함). 자세한 정책: `CLAUDE.md` "Perforce → GitHub 자동 미러 워크플로우" + `PRIVACY.md`.

## 1. 의도 (Intent)

본 파일은 인테리어 계획 검토용 **단일 HTML 3D 뷰어**다.

- 12 000 mm × 6 600 mm 의 3-bay 3-bed 평면 (한 가구 거주용) 의 변경 후 레이아웃·마감·가구 배치를 검증하기 위한 모델.
- 원본 평면도가 아닌 **변경안** 을 시각화 — 일부 벽을 이동·삭제·신설 (§3 참조).
- 사적 컨텍스트(시공 계약·견적·실측 사진·지출 등) 는 본 repo 외부에 비공개 보관. 본 repo 의 어떤 파일에도 단지명·소유자·계약자·금액·외부 파일명을 포함하지 말 것 ([PRIVACY.md](./PRIVACY.md)).

뷰어를 통해 1) 부감·1인칭 두 시점에서 변경된 동선을 걸어보고, 2) 침실 2 침대·서재 책상·발코니 세탁기·신발장·키친핏 가전·욕실 위생기구 등 주요 가구 배치를 검증하고, 3) SHIFT 키 조준 라벨로 방·문·가구·벽·창에 부여된 식별 번호를 확인해 수정 요청 시 “○번 방”, “○번 문” 등으로 정확히 참조하기 위함이다.

## 2. 동작 (Behavior)

### 2.1. 기술 스택
- **Three.js 0.150.1** (`vendor/three.min.js` 로컬 벤더링, `r150` UMD 빌드).
- 4 개의 `<script>` 블록을 순차 로드: `vendor/three.min.js` → 인라인(씬~조명) → `furniture.js` → 인라인(벽지~컨트롤) → `minimap.js` → 인라인(디버그+animate). 클래식 스크립트라 글로벌 스코프 공유.
- WebGL 렌더러 (`PCFSoftShadowMap`), 메인 `<canvas>` + 미니맵 보조 `<canvas>` + HTML 오버레이 (UI / aim-label / drag-arm-bar / minimap-legend / eye-label).

### 2.2. 좌표계와 단위
- 미터 단위, 1 mm = 0.001 m.
- X 축 분할: `0 | 1.5 | 5.1 | 7.8 | 10.5 | 12` (constants `xL/xBal/xKit/xBR/xHall/xR`).
- Z 축 분할: `0 | 2.7 | 4.2 | 4.8 | 6.6` (constants `zT/zM1/zM2/zBath/zB`).
- 천장 높이 `CH = 2.4 m`, 벽 두께 `WT = 0.12 m`, 바닥 슬라브 `FT = 0.05 m`, 표준 문 `0.9 m × 2.05 m`.
- 지오메트리는 박스 프리미티브 헬퍼(`B`, `slab`, `HW`, `VW`, `HWD`, `VWD`)를 기반으로 합성. `HWD`/`VWD` 는 문 개구부를 위해 좌·우 벽 + 상부 인방을 자동 분할.
- 타일 바닥은 `buildTileFloor()` 가 BufferGeometry 단일 메시로 생성, world-coord UV 매핑(`uv = (x/TW, z/TW)`)으로 어떤 방향으로도 이음새 없는 무한 반복.

### 2.3. 조명 (어둡게 튜닝됨) + 천장 조명 마커

**천장 조명 위치 마커 (`CEILING_LIGHTS`, CL 50308+)** — 사용자 요청에 따라 각 방 천장에 시각 전용 fixture 메시 (발광 X). `LIGHTING.rooms` 의 PointLight 와는 별개. 11 개 (각 방 1 개), `kind` 별 외관:
- `flush` (원형 다운라이트, 30 cm 기본): 거실확장·창고2·연결통로2·서재·침실2·복도·창고
- `panel` (사각 LED, 60 cm): 거실·주방·식당
- `wet` (방수 매립, 푸른 톤): 욕실·발코니

위치는 룸 bbox 중심 — 룸 중심에 fixture 가 표시됨. 배치 검토 후 위치 조정은 `CEILING_LIGHTS` 배열 한 곳 수정. y 위치는 `CH - t/2` 로 fixture 상면이 천장 underside (y=2.40) 에 정렬, 두께 25~35 mm 만큼 아래로 돌출.
- `AmbientLight 0xfff0e0` 강도 **0.18** (구버전 0.5 → 텍스처 흰색 클리핑 방지).
- `DirectionalLight 0xffeedd` 강도 **0.28** (그림자 방향성 역할만, shadow map 2048², 절두체 `±18 × ±14`).
- 방마다 `PointLight` (강도 0.30~0.55, 욕실은 청백색 0xe8f5ff). 광원 위치에 작은 `0xffffbb` 구체로 시각화.
- 합산 조도 ≈ 0.67 피크 — 텍스처 디테일이 죽지 않을 수준으로 의도적으로 낮게 유지.

### 2.4. 카메라 / 컨트롤
- **두 모드**, `Space` 로 토글. 전환 시 카메라 위치/시선 자동 리셋.
  - **프리 카메라 모드** (초기, 보라색 배지): `(6, 9.4, 3.3)` 정수직 부감. WASD 수평, 좌클릭 드래그(1 초 ARM 후) 시점 회전, 휠 = 시선 방향 줌, **R = 카메라 초기 상태 리셋**.
  - **1인칭 모드** (파란 배지): 시선 높이 `eyeHeight` (기본 1.60 m, **Q/E 로 ±1 cm 조정**, 0.30~2.30 m 클램프). 캔버스 클릭 → Pointer Lock 으로 마우스 시점 잠금, 다시 클릭 → 화면 중앙 레이캐스트로 문 토글. 우상단 `eye-label` 에 `cm` 표시.
- Pitch 제한 `±1.38 rad` (≈ ±79°).
- **드래그 ARM 시스템 (프리 모드 전용)**: 좌버튼 누른 후 1 초 동안 카메라 회전 안 함. 1 초 전에 떼면 “짧은 클릭” 으로 간주해 마우스 NDC 위치 레이캐스트로 문 토글. 1 초 경과 후 회전 활성화 (커서 아래 노란→녹색 프로그레스 바로 시각화). 짧은 클릭과 카메라 회전을 구분하기 위함.
- **인터랙티브 도어**: `_doors[]` 배열에 등록된 문을 클릭으로 토글. animate 루프에서 `dt × 7` 보간으로 부드럽게 애니메이션. 두 종류:
  - **회전형(swing/flap)**: `pivot/openRY/isOpen/doorMesh` (axis 미지정='y'=스윙, 'x'/'z'=플랩). `pivot.rotation[axis]` 보간.
  - **미닫이(slide)**: `kind:'slide'` + `pivot/doorMesh/slideAxis/slideOrigin/slideOpen/isOpen`. `pivot.position[slideAxis]` 보간. **`linkGroup`** 필드로 여러 패널을 연동 (3연동 중문 등) — 한 패널 클릭 시 같은 그룹 모두 함께 토글. 클릭 검출은 `intersectObjects` recursive=true 로 `THREE.Group` 안 메시까지 추적 후 부모 체인 거슬러 doorMesh 매칭.
- **충돌·중력 없음.** 1인칭에서도 벽·가구·외벽을 그대로 통과한다.
- **1인칭 X-ray**: 1인칭에서 카메라가 아파트 외곽 (`x∉[xL,xR]` 또는 `z∉[zT,zB]`) 으로 나가면 `mExt`/`mWall` 을 `visible=false` 로 숨김 → 외부에서 내부가 보이게.
- **천장 토글**: `mCeil.visible = !freeMode` — 부감(프리)에서는 천장 숨김, 1인칭에서만 표시.

### 2.5. SHIFT 조준 — 식별 라벨 + 치수 표시
- SHIFT 키를 누르고 있는 동안:
  - 프리 모드: 마우스 커서 위치를 NDC 로 변환해 레이캐스트.
  - 1인칭 모드: 화면 중앙(NDC 0,0) 에서 레이캐스트.
- 히트 분류 우선순위 (`_getAimInfo`): 문 → **콘센트** → 가구(BBox 5 mm 인셋) → 창문(BBox) → 벽(15 cm 이내 가장 가까운 세그먼트) → 방(좌표 사각형 안, 작은 박스 우선).
- **식별 라벨** (HTML `#aim-label`): 미니맵 번호와 동일 인덱스로 “@ROOM#9: 침실 2” / “@DOOR#16: 침실2 문” 같이 표시. 색상: 방=청, 문=황, 가구=녹, 벽=적, 창=청록, 콘센트=주황 (`.t-room`/`.t-door`/`.t-furn`/`.t-wall`/`.t-win`/`.t-outlet`).
- **콘센트 하이라이트** (사용자 요청, 1인칭/프리 공통): SHIFT-aim 으로 콘센트 plate 가 잡히면 `THREE.BoxHelper(plate, 0xffe040)` 로 노란 외곽선이 plate 둘레에 표시됨 (`depthTest:false` + `renderOrder:998` — 항상 가시). 라벨 텍스트 형식: `콘센트 N: <label> (<gangs>구[, 방수])`. 대상 변경 시 이전 BoxHelper 자동 dispose (geometry/material 누수 방지). hit.object 가 plate 또는 자식 hole 메시 모두 매칭.
- **치수 표시** (3D 스프라이트 `_dimGroup`): 너비/길이/높이를 cm 단위로 대상 모서리에 부착. 라벨과 같은 색의 `THREE.Line` 선분이 모서리를 따라 그려져 어느 길이를 가리키는지 시각적으로 명확. 축 색상: W(X)=빨강, D(Z)=파랑, H(Y)=녹색.
  - 방: W/D/H (높이 = `CH` = 240 cm)
  - 문: `doorMesh` world bbox 의 W/D/H
  - 가구: `FURNITURE_BBOX` (xz) + 높이 스캔 결과(`_computeFurnitureHeights()` 가 `scene.traverse` 로 bbox 안 메시 y 범위 계산, 스트럭처 제외 휴리스틱). 4-요소 BBox 가구의 높이 추정 실패 시 H 라벨 생략.
  - 벽: 길이/높이만 (두께 12 cm 표기 생략)
  - 창문: `WINDOWS_BBOX` 의 가로 길이 + `WINDOWS_H[i]` (parallel 배열)
- **다중 카테고리 동시 표시 (사용자 요청 2026-05-08)**: `_getAllAimInfo()` 가 한 위치에 적용되는 모든 카테고리 (문/콘센트/가구/창문/벽/방) info 객체를 배열로 반환. `_updateAimLabel()` 이 `#aim-label` 컨테이너 안 `.aim-item` 자식으로 stacked 렌더 — 각 항목이 본인 type 컬러 (t-room/t-door/t-furn/t-outlet/t-wall/t-win). 이전의 단일 라벨 + 220 ms hysteresis (`_stabilizedAim`) 는 제거 — 카테고리 전환이 사라져 hold 불필요. 우선순위 (배열 순서): 문/콘센트 → 가구 → 창문 → 벽 → 방. 치수 sprite 는 primary (배열 첫 번째) 매치만 표시.
- 미니맵 번호 ↔ aim 라벨 ↔ 사용자 요청의 “○번 ○○” 가 정확히 일치 — 인덱스 일관성이 라벨 정확성의 전제 (어셔션 §M / §P 가 자동 검증).

### 2.6. 미니맵 (좌하단)
- 504 × 288 px (`S = 40 px/m`, padding 12).
- **정적 레이어 캐싱** (항목 D): 방 채움(15)·벽 라인(43)·방 라벨(8) 을 `_staticBgCv` 에, 타이틀 바를 `_staticTopCv` 에 1 회만 렌더하고 매 프레임 `drawImage` 두 번 + 동적 FOV 부채꼴/포워드 레이/카메라 점/번호 배지 오버레이만 그림. 번호 배지는 hover-spread (항목 EE) 위해 동적 레이어로 분리.
- 카메라 FOV 부채꼴은 `camera.fov` 직접 참조(항목 B), 각도식 `-π/2 - yaw` (항목 H).
- **번호 배지 오버레이** (항상 표시): 방(원형 청, 13 px) → 문(황, 11 px) → 가구(녹, 10 px) → 벽(적, 9 px) → 창(청록, 10 px) 순서로 120+ 개. 첫 그리기 시 `computeBadgeLayout()` 가 나선 충돌-회피로 빈 자리 탐색(12 ring × 6~72 sample), 못 찾으면 실제 위치 그대로 둠. 옮겨진 배지는 실제 좌표 점 + 가는 흰선 콜아웃으로 가리킴. 한 번 계산 후 `_badgeLayout` 에 캐시.
- **Hover-spread (항목 EE)**: 마우스 커서가 미니맵 위에 있으면, 실제 위치 (`tx,ty`) 가 hover 점 36 px 안에 있는 배지들이 마우스 주변 64+ px 원 위에 균등 분포로 펼쳐짐. 굵은 흰색 리더 라인이 펼쳐진 배지 ↔ 실제 위치 점을 잇고, 점선 가이드 원이 호버 영역 표시. 펼쳐진 배지는 +2 px 확대해 가독성 보강. 캔버스는 `pointer-events:none` 이라 hover 검출은 `getBoundingClientRect()` + 모듈 스코프 `_mouseX/_mouseY` (window mousemove 추적) 비교로 처리. 매 프레임 `drawNumberOverlay(ctx)` 가 hover 상태를 읽어 동적 렌더.
- 외부 HTML 범례 (`#minimap-legend`) 가 미니맵 위에 “● 방 1~N / 문 N+1~ … / 가구 / 벽 / 창문” 고정 표시.

### 2.7. UI 오버레이
- 좌상단 `#ui`: 키 가이드 + 모드 설명.
- 우상단 `#badge`: 현재 카메라 모드 배지 (모드별 배경색 변경).
- 화면 중앙 `#ch`: 1인칭 십자선.
- 중앙 우측 `#eye-label`: 1인칭 눈높이 (cm).
- 화면 중앙 `#aim-label`: SHIFT 조준 식별 라벨 (타입별 색상).
- 커서 따라가는 `#drag-arm-bar`: 드래그 ARM 진행 상태 바.
- 하단 중앙 `#hint`: “화면 클릭 → 시점 고정” 1인칭 안내 (Pointer Lock 시 페이드 아웃).

### 2.8. 디버그 모드 (`?debug`)
- URL 파라미터 `?debug` 로 활성. 비활성 시 메시 0 개 추가 — 동작/성능 변경 없음.
- 활성 시 50 cm 그리드(어두운 회색) + 1 m 그리드(밝은 회색) + X 축(빨강) + Z 축(파랑) + 모든 가구 BBox 외곽선(녹색) 을 floor 위에 표시. `window._mmData` 로 미니맵 데이터 배열을 콘솔에서 접근.
- 변경 검증용: “@FURN#48 깊이를 1.95 m 로” 같은 수정 후 BBox 외곽선이 실제 메시와 정렬되는지 시각 확인.

## 3. 현재 상태 (Current State)

### 3.1. 공간 구획 (원본 평면도 대비 변경 포함)
| 공간 | X 범위 (m) | Z 범위 (m) | 비고 |
|---|---|---|---|
| 발코니 (위 = 거실확장) | 0 – 1.5 | 0.9 – 3.5 | **격벽 위쪽 제거, 거실로 개방.** 좌측 외벽이 베란다식 바닥~천장 연속창. |
| 발코니 (아래) | 0 – 1.5 | 3.5 – 6.6 | 분리벽 중앙 0.9 m 문 — **방화문 스타일** (사용자 요청, CL 50309+, 베이지 메탈 패널 + 트림 + 피프홀 + 데드볼트 + 클로저 + 라벨, 두께 6 cm). 난간 0.9 m + 침실2-발코니 창 (1.2 m). 우하단 (1.1–1.5, 6.2–6.6) PD. |
| 거실 | 1.5 – 5.1 | 0 – 3.5 | **z=3.5 까지 확장** (침실 2 상단 벽 80 cm 이동). 모듈식 2-seater 소파, 다이닝 테이블+벤치. |
| 주방·식당 | 5.1 – 7.8 | 0 – 4.8 | 거실과 개방. L 형 주방 가구(앞벽+우벽), 키친핏 냉장고+수납 일체형. |
| 서재 | 7.8 – 10.5 | 0 – 2.7 | **아치형 진입문**(반원 인방). 책상, 책꽂이 3 개(북측 1.20m × 2 + 남측 1.60m × 1), 벽걸이 로드 자전거. 동측 복도 창. |
| 연결통로 2 / 현관 | 7.8 – 10.5 | 2.7 – 4.2 | **녹색 슬라브, 5 cm 단차** (신발 영역) — 서측은 **중문 동면 x=8.896 까지** (CL 50302). 중문 서측 (x<8.896) 은 타일 바닥. 신발장 정면 앞 (z=2.7~3.77) 에 **중문 디딤판** — 동측으로 +30 cm (x=8.896~9.196) 돌출 (CL 50963, 사용자 요청). 좌측 양문형 신발장. |
| 침실 2 | 1.5 – 5.1 | 3.5 – 6.6 | 우벽 z=3.6~4.4 에 0.8 m 문 (10 cm fill). 퀸 침대. 발코니 측 창. |
| 욕실 | 5.1 – 7.8 | 4.8 – 6.6 | 상단 0.8 m 문. 변기/세면대/샤워파티션/샤워기/거울장/벽등/젠다이/매립 휴지걸이. 동쪽 chase (x=7.3~7.8). |
| 창고 | 7.8 – 10.5 | 4.2 – 6.6 | 위쪽 x=7.9~8.7 에 0.8 m 문 (10 cm fill). 6-door 붙박이장 + 3-door 붙박이장 2. 동측 복도 창. |
| 복도 | 10.5 – 12 | 0 – **4.2** | **z=4.2 까지 단축** (기존 0~6.6 → 0~4.2, 외벽 z=4.2 신설). 우측 외벽 절반 높이(CH/2). |
| 창고 2 | 0.6 – 1.5 | 0 – 0.9 | 신규. 좌상단 인덴트(외벽이 x=0~0.6 안쪽으로 들어옴). 남벽 중앙 0.7 m 문. |

### 3.2. 외벽·창문 변경 (원본 평면도와 다른 점)
- **좌측 외벽** (`x=0`): 인덴트(z=0~0.9) 이후 **베란다식 바닥~천장 연속창** — 유리①(거실확장 z=0.96~3.44) + 분리벽 기둥 + 유리②(발코니 z=3.56~6.54). 하단 10 cm 창대.
- **우측 외벽** (`x=12`): 복도 단축으로 z=0~4.2 만 존재, 그것도 절반 높이 (CH/2 = 1.2 m).
- **앞면 외벽** (`z=0`): 복도 구간(x=10.5~12)에 **현관문 (x=10.8~11.7)** 갭 추가 (`HWD`). 기타 구간 솔리드.
- **뒷면 외벽** (`z=6.6`): x=0~10.5 전고. **x=10.5~12 구간은 z=4.2 로 이동**(벽 82, 절반 높이 CH/2).
- **서재↔복도 창** (x=10.5, z=0.735~2.085, y=0.9~2.0, 폭 1.35 × 높이 1.1 m).
- **창고↔복도 창** (x=10.5, z=4.665~6.015, 동일 치수).
- **침실2↔발코니 창** (x=1.5, z=4.05~6.05, y=0.9~2.1, 폭 2.0 × 높이 1.2 m).

### 3.3. 마감재 / 텍스처
- **포세린 타일 바닥** (600 mm 타일, `_tileCv` 1024² 캔버스 절차 생성, 4 개 미세 색차 + 노이즈 + 구름형 얼룩 + 모서리 음영). 거실확장·거실·주방식당·서재·침실2·창고·연결통로 단일 메시.
- **벽지** (`_wpTex` 512² 절차 생성, 미세 입자 + 가로 가는 줄무늬). 거실·주방·서재·창고·침실2 내벽. 욕실·발코니·복도·창고2 제외(별도 마감 또는 외벽).
- **욕실 바닥** (`mBath`, 청회색 단색).
- **발코니 바닥** (`mBal`, 베이지 단색).
- **현관 바닥** (`mEntry`, 녹색, -5 cm 단차). 기본 x 8.896~10.5 / z 2.7~4.0 의 직사각형이었으나 **중문 디딤판 신설** (CL 50963, 사용자 요청) 로 L-shape: (a) 디딤판 동측 x=9.196~10.5, z=2.7~3.77, (b) 디딤판 북측 x=8.896~10.5, z=3.77~4.0. 디딤판 자체 (x=8.896~9.196, z=2.7~3.77) 는 buildTileFloor 의 quad 로 채워져 5 cm 단차 위 — 신발장 정면 발 디딤 공간 제공. 중문 서측 (주방·식당 측) 에서는 녹색 안 보임.
- **천장** (`mCeil`, 1인칭 전용 토글).
- **걸레받이** (높이 7.5 cm × 두께 1 cm, MeshPhong 백색 약광택). 욕실/복도/발코니 제외, 모든 내벽 양면 + 외벽 내면 + 인덴트/PD/배관 기둥 둘레.

### 3.4. 가구·설비
**거실/주방** — 2-seater 모듈식 소파 @FURN#70 (벽 103 부착), 오크 슬랩 트레슬 다이닝 테이블 @FURN#71 (1.6 × 0.8 × 0.73 m), 매칭 벤치 @FURN#72 (1.4 × 0.3 × 0.42 m). **사용자 요청에 따라 거실 가구 3 종(@FURN#70/71/72) 시각 숨김** — `furniture.js` 의 `HIDE_LIVING_FURN = true` 플래그로 메시 생성 IIFE 가 early return. FURN_META / FURNITURE / FURNITURE_BBOX 는 유지 (어셔션 영향 없음, SHIFT-aim 은 phantom 라벨 표시 가능). false 로 변경 시 다시 표시. 실내 자전거 @FURN#63 (Tacx Neo Bike Smart 스타일, 거실확장 NW 코너), 거실↔주방 사이 배관 기둥 @ROOM#14 (4.9~5.3, 폭 0.4 × 깊이 0.75 m, 전고).

**주방** — L 형 하부장 (앞벽 5 단 분할 + 우벽 4 단), 인덕션/싱크 위치 표시. **앞벽(z=0) 상부장**(@FURN#62, x=5.34~7.74 / z=0.06~**0.75** / y=1.55~2.40, 깊이 **0.69 m** × 폭 2.40 m × 높이 0.85 m): 단일 패널 4분할 정적 도어. 깊이는 사용자 요청에 따라 **배관 기둥(@ROOM#14, z=0~0.75) 앞면과 정렬** — 표준 상부장보다 약 2 배 깊어 다이닝 영역으로 약 37 cm 추가 돌출. **우벽(x=7.8 = 벽 90 라인) 축소판 2단 반투명 플랩 도어 상부장**(@FURN#73, x=7.44~7.74 / z=1.05~2.25 / y=1.50~2.10, 깊이 0.30 m × 길이 1.20 m × 높이 0.60 m, 천장에서 30 cm 아래): 각 단(0.30 m) 상단에 z 축 힌지, openR=−π/2 로 위로 들어올림 (`axis:'z'` 플래그). 도어는 `MeshLambertMaterial(color:0xc8d4d8, transparent:true, opacity:0.45, side:DoubleSide)` — frosted glass 톤. 키친핏 냉장고 양문형 (B+C 컬럼, x=6.85~7.75) + 수납장 단일도어 (A 컬럼, x=6.25~6.85), 모두 `_doors[]` 인터랙티브.

**서재** — 책상 (10.5 벽 부착, 1.8 × 0.8 m, 표준 0.74 m 높이, 다리 4 개), 5 단 오픈 책꽂이 3 개 (1.85 m 높이 × 25 cm 깊이; @FURN#64 북측 우 1.20m + @FURN#65 북측 좌 1.20m + @FURN#66 남측 1.60m), 벽걸이 로드 자전거 (S-Works 스타일, 벽 76 수평 마운트).

**침실 2** — 퀸 침대 (헤드보드 + 프레임 + 매트리스 1.52 × 1.88 + 베개 2 + 풋보드, 머리 → z=6.6 벽 중앙).

**욕실** — 원피스 변기, 스퀘어 월행 세면대, 샤워 파티션 (솔리드 + 유리), 천장 매립 샤워기 (벽 80), 2 단 젠다이 (벽 80 좌측~파티션 좌면, 파티션 우면~벽 107), 매립형 휴지걸이 (좌벽), 거울장 (세면대 상부, 인터랙티브 도어), 세로 벽등 2 개 (변기 뒤).

**현관** — 양문형 신발장 @FURN#50 (좌측 2 칸 활성, 우측 1 칸은 방 15 기둥). 폭 **0.98 m × 깊이 0.37 m × 높이 2.40 m**, x=8.90~9.88 (사용자 요청에 따라 좌측 20 cm 수축, 벽 96 쪽 — 우측 기둥 — 부착 유지). 도어는 양 외변에 **flush 부착** (panelW=0.48, hinge x=8.90/9.88, 중앙 reveal 2 cm 만 유지) — 측면 4 cm 이격 매움 (사용자 요청). 도어 z 위치는 측판 front face 보다 1 mm 앞으로 오프셋 (`-DT/2-0.001`) 해 z-fighting 회피. `_doors[]` 인터랙티브.

**신발장 좌측 부착 중문 (영림 초슬림 간살 3연동)** — 1차 설치 시 현관-주방 경계 (x=7.8) 에 두었으나 사용자 요청으로 **신발장 (@FURN#50, x=8.90~9.88) 좌측 외변** 에 부착하도록 이동. 새 위치: xJM=8.855 (신발장 좌면 8.900 으로부터 4 mm 서쪽 시각 갭), 트랙 x=8.825/8.855/8.885 (±30 mm), **z=2.76~4.14 (1.38 m)** — 서재 벽 (z=2.7) 과 창고 벽 (z=4.2) 의 내면 사이로 단축 (이전 1.50 m, x=8.86 위치는 솔리드 벽 구간). 신발장 영역(동측) 과 주방·식당 통로(서측) 를 분리하는 sub-partition 으로 동작 — 신발장이 입구 vestibule 안쪽에 배치되는 한국 아파트 표준 레이아웃. 각 패널 **0.46 m** × 2.30 m × 22 mm, 알루미늄 다크 차콜 프레임 (좌우 30 mm / 상하 40 mm) + 프로스티드 글래스 (opacity 0.32) + 세로 간살 5 살/패널 (8 × 8 mm 단면, 양면 부착). 상부 천장 직하 박스 레일 (100 × 60 mm) + 하부 바닥 라인 가이드. **인터랙티브 미닫이** — 클릭 시 3 패널이 함께 +z (북쪽) 방향으로 슬라이드: 패널 1 (+0.92 m), 패널 2 (+0.46 m), 패널 3 (정지) → 모두 z=3.68~4.14 에 적층 (신발장 좌측 외변 따라 L-shape), 남쪽 z=2.76~3.68 (0.92 m) 통로 개방. `_doors[]` 에 `kind:'slide'` + `linkGroup:'jungmun'` 으로 등록 — 어느 패널 클릭해도 3 개 모두 동기 토글. @DOOR#49/50/51. 인접 입구 (서재/창고) 와 미충돌.

**창고** — 6-door 붙박이장 (벽 83 = 서벽 x=7.8, 폭 2.4 m), 3-door 붙박이장 2 (벽 93 = 북벽 z=4.2, 폭 1.2 m). 모두 인터랙티브.

**창고 2** — 별도 가구 없음 (작은 정리 공간, 남벽 0.7 m 문).

**발코니** — 드럼 세탁기 (0.9 × 0.9 × 1.275 m, 회색, 좌하단 PD 와 0.15 m 클리어런스 위해 cx=0.5 로 이동).

**문 일람** (`DOORS[]` 배열 순서, 미니맵 번호와 일치):
침실 2 / 창고 / 욕실 / 창고 2 / 발코니 / 주방 하부장(앞 5 개) / 주방 하부장(우 4 개) / **주방 플랩 상부장(우) 2 단(하/상)** / 거울장 / 수납장 / 냉장고(좌·우) / 현관문(외) / 방화문(내) / 신발장(좌·우) / 창고 붙박이장 (6 개) / 창고 붙박이장 2 (3 개) / **영림 3연동 중문 (3 패널, 미닫이)**. 총 **36 개** (회전형 33 + 미닫이 3).

### 3.5. 알려진 제약·간극
- **충돌 처리 없음** — 1인칭에서 벽·가구·외벽을 통과 (X-ray 효과로 외부 시점에서 내부가 보이게 한 것이 의도적 회피).
- **5 cm 단차 시각만** — 현관(-0.05)·복도(-0.05) 이지만 카메라 Y 는 1.6 m 고정.
- **`FURN_CATALOG` 의 가전·가구 모델 번호** 와 실제 모델링된 박스의 정확한 치수·렌더 동일성은 검증되지 않음 — 위치만 표현. 모델 번호는 일반 카탈로그 공개값.
- **CSV 옷장 후보 3 종** (제크리/이안빅/블룸) — 미반영. 서재·2 의 옷장은 모델링되지 않음.
- **반응형/모바일 검증 없음** — `resize` 핸들러는 카메라 aspect / DPR / renderer size 갱신은 하지만 터치 컨트롤 미구현.
- ~~**CDN 의존**~~ — Three.js 0.150.1 이 `vendor/three.min.js` 로 동봉되어 오프라인에서도 동작.
- ~~**단일 파일**~~ — 항목 R 로 분할 완료 (`index.html` 1 943 줄 / `furniture.js` 1 930 / `minimap.js` 994). 빌드 단계 없이 클래식 스크립트 4 개 블록으로 로드.

### 3.6. 코드 위생 관찰 (개선 후보)
- ~~**레이아웃 좌표 다중 하드코딩**~~ — **[항목 A 완료]** `zLR2 = 3.5` 상수를 신설해 3D 지오메트리·벽지·걸레받이·미니맵 `ROOMS`/`WALLS` 모든 곳에서 단일 원천 참조. 미니맵 `ROOMS`/`WALLS` 의 그리드 좌표도 `xL/xBal/xKit/xBR/xHall/xR`, `zT/zM1/zM2/zBath/zB` 명명 상수를 사용하도록 일괄 변환. 오프-그리드 값(인덴트 0.6, 창고2 깊이 0.9, PD/chase/배관 기둥 좌표) 만 리터럴로 유지.
- ~~**카메라 FOV `72`**~~ — **[항목 B 완료]** 미니맵 `halfFOV` 계산이 `camera.fov` 를 직접 참조하도록 변경. `PerspectiveCamera` 생성자가 단일 원천이 됨.
- ~~**`animate()` 매 프레임 객체 할당**~~ — **[항목 C 완료]** 4 개의 임시 `Vector3` (`_fwd/_right/_up3/_move`) 를 모듈 스코프에 한 번만 생성하고 매 프레임 `.set()` 으로 재사용. `_up3` 는 (0,1,0) 고정이라 갱신도 생략. 60 fps × 4 alloc/frame = 240/s 의 신규 GC 부담이 0 으로 감소.
- ~~**미니맵 풀 리드로**~~ — **[항목 D 완료]** 정적 레이어를 두 개의 오프스크린 캔버스(`_staticBgCv` = bg+rooms+walls+room labels, `_staticTopCv` = title+번호 배지) 에 1회만 렌더하고, 매 프레임에는 `drawImage` 두 번 + 동적 FOV 부채꼴/카메라 점만 그림. `drawBadge`/`drawNumberOverlay` 가 컨텍스트 인자를 받도록 시그니처 변경. ROOMS/WALLS/DOORS/FURNITURE/WINDOWS 를 런타임에 변경할 일이 생기면 `_staticReady = false` 로 캐시 무효화.
- ~~**`B()` 헬퍼가 모든 박스에 그림자 캐스팅 부여**~~ — **[항목 E 완료]** `slab()` 헬퍼가 비-천장(`mat !== mCeil`) 슬라브에 한해 `castShadow = false` 설정. 모든 광원(sun, ptLight) 이 슬라브 위쪽에 있어 바닥 아래 그림자는 시각적으로 의미 없음. 천장은 1인칭에서 햇빛을 막아야 하므로 캐스팅 유지.
- ~~**`devicePixelRatio` 갱신 누락**~~ — **[항목 F 완료]** `resize` 핸들러에 `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` 한 줄 추가. 모니터 변경/브라우저 줌 변동 시에도 렌더 해상도가 디스플레이 DPR 에 맞춰 갱신.
- ~~**`var` 와 ES5 `||` 기본값 혼재**~~ — **[항목 G 완료]** 헬퍼 7 개(`B`, `slab`, `HW`, `VW`, `HWD`, `VWD`, `ptLight`) 의 기본값을 ES6 default params 로, 내부 `var` 를 `const` 로 교체. 0 이 명시적으로 전달되어도 기본값으로 덮이지 않게 됨(현재 호출처는 0 을 전달하지 않지만 안전망).
- ~~**미니맵 각도식**~~ — **[항목 H 완료]** `Math.atan2(-cos(yaw), -sin(yaw))` 을 `-π/2 - yaw` 로 단순화. `arc()`/`cos`/`sin` 모두 2π 주기이므로 시각 결과 비트-동일.
- ~~**CDN SRI 없음**~~ — **[항목 I 완료]** Three.js 0.150.1 을 `vendor/three.min.js` (613 KB) 로 벤더링하고 `<script src="vendor/three.min.js">` 로 변경. SHA-256 체크섬을 주석에 부기. CDN/오프라인 의존성 완전 제거.

### 3.6.1. 작은 위생들 (항목 J 완료)
- `if (document.exitPointerLock) document.exitPointerLock();` → `document.exitPointerLock();`. 모든 모던 브라우저 지원.
- `var dt = clock.getDelta(); if (dt > 0.05) dt = 0.05;` → `var dt = Math.min(clock.getDelta(), 0.05);`. 한 줄로 정리.

### 3.6.2. 미래 LLM 유지보수성 개선 (항목 K~T)

향후 “가구 측정값 반영”, “벽 위치 이동”, “재료 변경” 등 자연어 요청을 안정적으로 받아내기 위한 구조 개선. 동작 비트-동일.

- **[항목 M 완료] 자기검증 어셔션** — 미니맵 IIFE 끝에 `_doors.length === DOORS.length`, `FURNITURE.length === FURNITURE_BBOX.length`, `WINDOWS.length === WINDOWS_BBOX.length`, ROOMS/WALLS/BBox 좌표 sanity 를 `console.assert` 로 1 회 검사. 한 곳 누락 시 즉시 콘솔 경고 → 미니맵-3D 인덱스 어긋남 조기 발견.

- **[항목 O 완료] 안정 식별자 앵커** — 모든 미니맵 데이터 배열 항목과 가구 IIFE 섹션 헤더에 `@TYPE#NN` 앵커 부착. 현재 형식: `@ROOM#1..15`, `@DOOR#16..51` (회전형 31 + 신발장 양문 2 + 미닫이 3), `@FURN#47..73` (FURN_META id 안정), `@WIN`/`@WALL` 은 미니맵 배열만. **주의**: `@FURN#NN` 은 FURN_META id 라 안정하나 미니맵 BADGE는 `15+DOORS+i+1` 로 동적 — 현재 가구 BADGE 52..78. 가구·문 추가 시 후속 카테고리 BADGE 자동 시프트. 자세한 시간적 비안정성 분석은 §4.19 참조. 어셔션 §M 이 카운트 일관성 검증.

- **[항목 L 완료] 재료 팔레트 중앙화** — `materials` 섹션 끝에 `PAL` 네임스페이스(우드톤·금속·패브릭) 와 팩토리 헬퍼 `makeLambert(color, opts)` / `makePhong(color, opts)` 신설. 자주 재사용되는 머티리얼은 `PAL.matLever` / `PAL.matCabinetDoor` 처럼 인스턴스 캐시. 가장 변경 빈도가 높은 우드톤 4 곳(침대 프레임, 책상 상판/다리) + 가전 외관 + 세탁기 도어를 PAL 참조로 마이그레이션 (대표 사례). 신규 가구는 `PAL.wood.*` / `PAL.metal.*` 를 통해 정의 — 향후 “모든 우드톤을 월넛으로” 같은 일괄 변경이 PAL 한 곳만 수정으로 가능.

- **[항목 N 완료] 계측 출처 주석 컨벤션** — 치수의 출처를 표시하는 통일 마커 도입:
  - `@MEASURED YYYY-MM-DD` — 현장 실측값 (또는 제품 스펙시트 확인). 변경 시 새 측정값 반영 외에는 함부로 수정하지 않음.
  - `@ESTIMATE` — 설계 추정/표준 치수/스타일 참조 (예: “표준 책상 높이 0.74 m”, “Tacx Neo Bike 스타일”). 실측값이 들어오면 `@MEASURED` 로 갱신 가능.
  - `@SCALED` (선택) — 의도적 비례 조정 (예: “실제 치수 × 1.5”).

  대표 사례 마킹: 드럼세탁기 치수(`@ESTIMATE`), 책상 표준 높이(`@ESTIMATE`). 미마킹 = 출처 미기록 — 이 경우 변경 시 출처 마커를 같이 추가하는 것을 컨벤션으로 함.

- **[항목 K 완료] 데이터 중심 정의 (인프라 + 파일럿)** — `FURN_REGISTRY` 배열과 `defineFurniture(spec, build)` 헬퍼를 FURNITURE 섹션 시작에 도입. spec 객체는 `{id, name, room, pos, size, bbox, ...}` 형태로 가구 메타데이터를 모으며, 빌더는 `spec` 만 보고 메시 생성. 가장 단순한 박스 가구 3 점을 파일럿 변환:
  - **@FURN#47 드럼세탁기**: pos·size·bbox 가 spec 한 곳에 집약
  - **@FURN#48 침실2 침대**: frame/head/matt/pillow/foot 5 개 컴포넌트 모두 spec 객체로
  - **@FURN#49 서재 책상**: 상판·다리 치수 5 개 spec.size 로 통합

  결과: “책상 길이를 1.6 m 로” 같은 요청이 `spec.size.dD = 1.60` 한 줄 수정으로 처리됨. 나머지 25 개 가구(자전거·캐비닛·주방·욕실 위생기구 등)는 형상이 복잡하여 점진 마이그레이션 — 새 IIFE 추가 시 `defineFurniture` 패턴을 우선 사용.

- **[항목 P 완료] 표준 빌더 일관성 검증** — 미니맵 IIFE 끝 어셔션 블록에 `FURN_REGISTRY` ↔ `FURNITURE[]`/`FURNITURE_BBOX[]` 일치 검사 추가. 마이그레이션된 가구마다 `spec.id` 로 글로벌 번호를 갖고 있고, 미니맵 배열 인덱스 = `spec.id - 47`. 이름·bbox 가 어긋나면 `[P] FURN#NN 이름 불일치` 같은 콘솔 경고. → `defineFurniture` 로 가구 정보를 수정한 뒤 미니맵 배열 동기 갱신을 깜빡하면 즉시 발각.

- **[항목 Q 완료] 텍스처 파라미터화** — 절차적 캔버스 텍스처 두 개를 config 객체 + 빌더 함수로 분리:
  - `TILE_CONFIG` + `buildTileCanvas(cfg)` — 포세린 타일 (groutColor, baseColors[4], noiseDensity, cloudCount/Radius/Alpha, edgeShadow 등 12 개 파라미터)
  - `WALLPAPER_CONFIG` + `buildWallpaperTexture(cfg)` — 벽지 (baseColor, noiseDensity, lineCount, lineAlpha 등 7 개 파라미터)

  “타일 더 어둡게” = `TILE_CONFIG.baseColors` 한 줄 수정. “줄눈 더 진하게” = `groutColor`. “벽지 베이스 톤 변경” = `WALLPAPER_CONFIG.baseColor`. 빌더 본문 손대지 않음.

- **[항목 T 완료] 단위 변환 헬퍼** — `LAYOUT CONSTANTS` 섹션에 `mm(v)` / `cm(v)` 헬퍼 추가 (`v * 0.001` / `v * 0.01` 한 줄 함수). 사용자 요청이 mm/cm 단위로 들어오면 `mm(1800)` 같이 명시적으로 표기 가능. 코드 단위(m) 와 요청 단위(mm/cm) 사이의 암산 실수 방지.

- **[항목 S 완료] 디버그 모드** — `?debug` URL 파라미터로 활성화. 비활성 상태에서는 어떤 메시도 생성되지 않아 동작/성능 변경 0. 활성 시:
  - 50 cm 그리드 (옅은 회색) + 1 m 그리드 (조금 진하게)
  - X(빨강) / Z(파랑) 축 표시 (원점 부각)
  - 모든 가구 BBox 외곽선 (녹색) — 가구 위치/충돌 검증용
  - `window._mmData` 로 미니맵 데이터 배열을 콘솔에서 접근 가능

  사용 예: `index.html?debug` 로 열어 가구 BBox 가 실제 메시와 정렬되었는지, 좌표축이 의도한 방향인지 시각 확인.

- **[항목 R 완료] 파일 분할** — 가장 부피가 큰 두 섹션을 외부 `.js` 로 분리:
  - `furniture.js` — FURNITURE 섹션 전체 (~2120 줄, FURN_REGISTRY 인프라 + 29 개 가구 IIFE)
  - `minimap.js` — MINIMAP IIFE 전체 (712 줄, ROOMS/WALLS/DOORS/FURNITURE/WINDOWS 데이터 + drawMinimap + 어셔션)
  - `index.html` — 4577 줄 → **1943 줄** 로 감소

  로드 순서: `vendor/three.min.js` → 인라인 (씬·라이팅·재료·레이아웃·헬퍼·텍스처·바닥·천장·외벽·내벽·걸레받이·문·라벨·라이트) → `furniture.js` → 인라인 (벽지·키친핏·외부문·신발장·카메라·컨트롤) → `minimap.js` → 인라인 (디버그·애니메이션). 각 분리된 파일은 모두 `<script src="...">` 로 로드 — 클래식 스크립트라 글로벌 스코프 공유. 빌드 단계는 여전히 불필요.

  효과: 가구나 미니맵 변경 요청을 받으면 LLM 이 해당 단일 파일만 read 하면 충분 → context window 부담 감소, 정확도 상승.

### 3.6.3. SHIFT 조준 치수 표시 — 구현 디테일

사용자 가시 동작은 §2.5 참조. 본 절은 `minimap.js` 안의 구현 노트.

- `_makeDimSprite(text, color)` — 256×64 캔버스에 색 테두리 + 본문 텍스트, `SpriteMaterial(depthTest:false)` + 0.5 m × 0.125 m 월드 스케일.
- `_addDimLine(axis, x1,y1,z1, x2,y2,z2)` — `BufferGeometry` + `LineBasicMaterial(depthTest:false)` 로 모서리 색상 선분. `renderOrder = 998` (sprite=999 보다 아래).
- 모든 라벨/선분은 **bottom-front-left** 코너 `(x1, y0, z1)` 에서 각 축으로 뻗어나가는 모서리에 부착. 라벨은 모서리 정확히 중앙 → `──[ 360 cm ]──` 건축 도면 스타일.
- `_computeFurnitureHeights()` — 4-요소 BBox 가구의 높이 추정 (`scene.traverse` 로 BBox 안 메시 y 범위 합집합 + 스트럭처 휴리스틱: 메시 XZ 범위가 BBox + 0.30 m 보다 크면 벽/바닥/천장으로 간주해 제외).
- `_showDimensions(info)` — 매 프레임 `_updateAimLabel` 에서 호출. 대상 ID 무변동 시 sprite/line 재생성 생략.
- `_getAllAimInfo(ndcX, ndcY)` — 한 위치 적용 모든 카테고리 info 배열 반환. 사용자 요청 (2026-05-08) 으로 단일 라벨 + 220 ms hysteresis (`_stabilizedAim`) 대신 다중 라벨 동시 표시 — 자세한 사례는 §4.7 / §4.20.
- `_dimGroup.visible` 로 SHIFT 해제/aim 미명중 시 숨김. 텍스처·머티리얼·LineGeometry 모두 `dispose` 처리.

### 3.6.4. 시나리오 적합도 개선 (항목 U~DD)

“가구 배치 시뮬레이션 / 자재 검토 / 인테리어 결과 예상” 자연어 요청을 LLM 이 안정적으로 처리하기 위한 메타 카탈로그·검증·설정 구조 확장. 동작 비트-동일.

- **[항목 U 완료] 가구 메타 카탈로그 `FURN_META`** — `furniture.js` 상단(`FURN_REGISTRY` 옆) 에 27 개 가구 모두에 대한 `{id, name, room, pos, size:{W,D,H}, bbox, source}` 단일 객체. 키는 가구 인덱스 + 47 (47..73) — 가구 추가/삭제로 글로벌 `@FURN#` 번호가 시프트되어도 키는 인덱스 위치를 따름. K 마이그레이션 여부와 무관하게 LLM·콘솔이 한 번의 lookup 으로 가구 메타데이터 확보. `Object.values(FURN_META).filter(m => m.room === '욕실')` 같은 질의 가능. 미니맵 IIFE 끝에서 `[U]` 어셔션이 `FURN_META[id]` ↔ `FURNITURE[idx]` ↔ `FURNITURE_BBOX[idx]` 일치를 검증.

- **[항목 CC 완료] 클리어런스/충돌 검사** — 미니맵 IIFE 끝 어셔션 블록에 init time 1 회 실행되는 충돌 검사 추가:
  - 가구 ↔ 가구: xz 사각형 + (양쪽 6-요소 bbox 일 때) y 범위 겹침. 5 mm 톨러런스(접촉은 허용).
  - 가구 ↔ 벽: 5 cm 인셋한 가구 bbox 안으로 벽 세그먼트가 침투(`_segVsRect` / `_segVsSeg` 헬퍼)하면 경고. 벽에 붙은 가구는 인셋 덕분에 false positive 안 남.

  발견 시 `console.warn('[CC] FURN#NN ↔ FURN#MM 겹침')` / `[CC] FURN#NN 가 WALL#KK 침투`. 동작 변경 0, init 비용 무시 가능 — LLM 이 가구를 옮긴 직후 즉시 발각.

- **[항목 W 완료] 조명 설정 `LIGHTING`** — `index.html` LIGHTING 섹션의 ambient + sun + 10 개 PointLight 가 단일 `LIGHTING` 객체로 통합 (`{ambient, sun:{...,position,shadowFrustum,...}, rooms:[{name,x,z,color,intensity,range}, ...]}`). `applyLighting(cfg)` 가 ambient/sun 설정, 그 다음 `LIGHTING.rooms.forEach(r => ptLight(...))` 가 방별 조명 일괄 생성. “모두 따뜻하게” / “욕실만 더 밝게” / “저녁 톤” 같은 일괄 변경이 LIGHTING 객체 한 곳 수정으로 처리됨.

- **[항목 Z 완료] 콘솔 인스펙터 헬퍼** — `minimap.js` 끝에서 `window._inspect(ref)`, `window._gap(a, b)`, `window._listRoom(name)` 노출. 모두 `FURN_META` 를 단일 데이터 원천으로 사용:
  - `_inspect(48)` 또는 `_inspect('FURN#48')` → `{id, name, room, pos, size:{W,D,H,W_cm,D_cm,H_cm}, bbox_xz, bbox_y, source}` 반환.
  - `_gap(48, 49)` → 두 가구 BBox 의 xz 클리어런스 (cm). 겹치면 `overlap:true`.
  - `_listRoom('욕실')` → 해당 방의 모든 가구 목록 (W×D×H cm 포함).

  SHIFT-aim 시각 라벨이 “지금 보고 있는 것” 을 알려주는 반면, 인스펙터 헬퍼는 “이름·번호로 정량 질의” 가 가능. 둘은 보완관계.

- **[항목 Y 완료] 일반 가구 템플릿 `FURN_CATALOG`** — `furniture.js` 의 `FURN_META` 다음에 자주 추가될 표준 가구 13 종 카탈로그. 카테고리: 옷장 3 종(슬라이딩 1200×3 외형), 책장·책상 2 종, LG DIOS 가전 4 종(냉장고·식기세척기·인덕션·전자레인지 — 일반 카탈로그 공개 모델 번호), 표준 가구 4 종(퀸/킹 침대, 2-seater 소파, 4인 다이닝 테이블). 각 항목 `{kind, W, D, H, label, model?, color?}` — 신규 가구 요청 시 LLM 이 카탈로그 lookup 으로 정확한 치수/라벨 적용. 데이터만 — 실제 메시 빌더는 별도 IIFE 작성 필요.

### 3.6.5. 벽 콘센트 (`OUTLETS`) + SHIFT-aim 하이라이트
- **데이터 정의** — `index.html` 의 신발장 섹션 다음에 데이터 중심 콘센트 시스템. 17 개 항목이 각 방의 표준 위치(소파 옆/주방 작업대 위/침대맡/세면대 위/세탁기/현관 등) 에 배치됨. `OUTLETS = [{x, y, z, face, gangs, kind?, label?}, ...]` 의 한 객체 추가/삭제로 콘센트 추가/제거. `face` 는 콘센트 패널이 *향하는* 방향(N/S/E/W = +z/-z/+x/-x), `x/y/z` 는 벽 내면 좌표 (예: 남쪽 외벽 z=0 의 내면 z=`WT/2`=0.06). `gangs`=1/2/3, `kind`='wet' 시 욕실 방수형(베이지 톤). 빌더가 5 mm 클리어런스로 벽지와 z-fight 회피.
- **레지스트리 노출** — `buildOutlet()` 가 각 plate 메시를 글로벌 `_outlets[]` 에 `{plate, spec}` 으로 push. minimap.js 의 SHIFT-aim 검출이 이 레지스트리를 참조.
- **SHIFT-aim 하이라이트** — `_getAllAimInfo()` 가 적용 모든 카테고리 배열 반환 (배열 순서: 문/콘센트 → 가구 → 창문 → 벽 → 방). 콘센트 plate 가 잡히면:
  - 식별 라벨: `콘센트 N: <label> (<gangs>구[, 방수])` — 주황 배경 (`.t-outlet`). 다른 카테고리 라벨과 함께 stacked 표시 (§4.20).
  - 시각 하이라이트: `_showOutletHighlight()` 가 `THREE.BoxHelper(plate, 0xffe040)` 노란 외곽선을 띄움 (`depthTest:false`, `renderOrder:998`).
  - 다중 라벨 시스템 (§4.20) — 카테고리 전환 없이 동시 표시.
  - 대상 변경 시 이전 BoxHelper geometry/material 모두 `dispose()` (GPU 메모리 누수 0).

### 3.6.6. 공개 GitHub 미러 + 민감정보 보호 정책
- **GitHub repo**: `https://github.com/neoocean/house-model` (public, GPL-3.0).
- **단일 자동화 스크립트**: `~/bin/mirror-to-github.sh` — 매 P4 submit 직후 호출. 5 단계 (rsync → git-only 파일 복구 → 변경 점검 → 키워드 audit → commit + push). commit message 는 P4 의 최신 CL 번호·설명을 자동 부기 (예: `P4 CL 50248 미러: <설명 첫 줄>`).
- **민감정보 차단 안전망**: `~/.house-model-sensitive-keywords.txt` (저장소 외부 비공개) 의 패턴이 `git diff --cached` 에 포함되면 push 차단(exit 2). 차단 시 사용자 검토 후 수동 commit 가능.
- **PRIVACY.md** 가 단일 정책 원천:
  - §1 절대 commit 금지 5 카테고리 (거주자/거래/금전/외부 첨부/시스템 메타)
  - §4 push 전 grep 자동 점검 가이드
  - §5 노출 시 사후 처치
  - §6 LLM 에이전트 작업 시 주의사항 — `CLAUDE.md`/`AGENT.md` 의 상단 경고 박스가 자동 컨텍스트로 LLM 에 노출되어 문서 변경 시 식별 정보 추가를 미연 방지.
- **현황**: 초기 미러 시점 audit 통과, 식별 키워드 9 종 (단지·시공사·거래처·외부 파일명·시스템 메타) 모두 0 건.

### 3.6.7. 사용자 요청 변경 묶음 (CL 50270 ~ 50302)

8 개 CL 에 걸쳐 누적된 사용자 요청 변경 — 신발장 영역 + 미니맵 인터랙션 + 영림 3연동 중문.

- **CL 50270**: @FURN#62 주방 상부장(앞) 깊이 0.32→**0.69 m**. 배관 기둥(@ROOM#14, z=0~0.75) 앞면과 정렬 — 다이닝 영역으로 약 37 cm 추가 돌출. FURN_META[62] + 주방 IIFE DU 상수 + minimap FURNITURE/FURNITURE_BBOX 동기.
- **CL 50276**: 미니맵 hover-spread 콜아웃 (§4.15). 마우스 호버 시 주변 36 px 안 배지가 64+ px 원에 펼쳐져 disambiguation. `_staticTopCv` 캐시에서 배지 layer 제거, 매 프레임 동적 호출.
- **CL 50280**: @FURN#50 현관 신발장 폭 1.18→**0.98 m** (-20 cm). 좌측 수축, 우측(벽 96 쪽 = 기둥 @ROOM#15) 부착 유지. 신발 위치 우측 0.85/0.86 → 0.66 으로 조정 (좌우 0.32 대칭).
- **CL 50283**: 신발장 도어 측면 4 cm 이격 매움. panelW 0.44→0.48, hinge 8.94→cBaseX(8.90), 9.84→cBaseX+cW(9.88) 으로 몸체 외변 flush. 도어 z 위치 -1 mm 오프셋 (`-DT/2-0.001`) 으로 측판 z-fighting 회피.
- **CL 50286**: 영림 초슬림 간살 3연동 중문 추가 (정적). x=7.8 (현관-주방 경계) 의 1.5 m 개구. 알루미늄 다크 차콜 프레임 (좌우 30 mm / 상하 40 mm) + 프로스티드 글래스 (opacity 0.32) + 세로 간살 5 살/패널 (8 × 8 mm 양면) + 상부 천장 직하 박스 레일 + 하부 바닥 라인 가이드.
- **CL 50289**: 중문 인터랙티브 미닫이 시스템 (§4.16). `_doors[]` 에 `kind:'slide'` 분기 도입 — `pivot.position[slideAxis]` 보간. `linkGroup:'jungmun'` 으로 3 패널 동기 토글. raycast 의 `intersectObjects(_, true)` recursive 활성화 + 부모 체인 매칭. DOORS.length 33→36 → 후속 카테고리 배지 +3 시프트 (§4.19).
- **CL 50296**: 중문 위치 신발장 좌측 부착 (§4.17). x=7.8→**xJM=8.855** (신발장 좌면 4 mm 시각 갭), 트랙 8.825/8.855/8.885. z 범위 1.50→**1.38 m** (zM1+WT/2 ~ zM2-WT/2, 서재·창고 벽 내면 사이 — 솔리드 벽 침투 회피). panelW 0.50→0.46.
- **CL 50302**: 현관 녹색 영역 중문 정렬 (§4.18). mEntry 슬라브 west edge 8.7→**8.896** (중문 동측 패널 동면). 노출된 영역에 `buildTileFloor()` quad 추가 + 라이저 동기.

> **CL 갭 안내**: §3.6.7 (CL 50270~50302) 와 §3.6.8 (CL 50372~) 사이의 CL 50303~50371 은
> 본 model/ 디렉토리 외 (다른 P4 작업 영역) 에서 발생한 CL 들이거나, 본 디렉토리 내에서도
> 사소한 변경(주석/문서/가구 작은 위치 조정 등)이라 별도 §로 정리하지 않음. 의미있는
> 변경 추적은 `p4 changes -m N ./...` 또는 P4 web UI 로 조회.

### 3.6.8. 전원 계획 (PP) 모드 + outlets.js 분리 + 한국 220V Type-F (CL 50372 ~ 50416)

전원 콘센트 검토를 위한 별도 시각 모드 + 콘센트 데이터·빌더 외부 파일 분리 + 한국 표준 콘센트 형태 적용. 30+ CL 누적, 18+ 사용자 요청 처리.

#### A. 전원 계획 모드 (PP, **`2` 키 토글**, 이전 `1` — CL 50974)

`index.html` 의 `_initPowerPlanCache()` / `_initOutletOutlines()` / `setPowerPlanMode(on)` + Digit2 keydown 리스너 (이전 Digit1). PP 진입 시:

1. **가구 분류 캐싱** (`_initPowerPlanCache`, 1 회만 실행):
   - hide 대상 bbox 목록 = `FURN_META` 의 모든 항목 — 단 `id===50` (신발장) + `room==='욕실'` (변기·세면대·샤워파티션·휴지걸이·거울장·벽등 7 종) **제외**.
   - `scene.traverse` 로 메시들을 분류:
     - 콘센트 plate / 자식 hole 메시 (outletSet) 제외
     - 구조 머티리얼 (`mWall` / `mExt` / `mBath` / `mBal` / `mEntry` / `mCeil` / `mWin` / **`mSkirting`** 전역) 제외 → 벽·외벽·바닥(욕실/발코니/현관)·천장·창문 유리·걸레받이 보존
     - 벽지 / 아치 스팬드럴 (material.map === `_wpTex`) 제외
     - **벽 도어 보존, 캐비닛 도어 hide**: 도어 pivot xz 가 hide-target 가구 bbox 안 (DOOR_SLACK ±5cm) 이면 캐비닛 도어로 분류 → 부모 가구와 함께 hide. 그 외 (방 사이 / 외부 / 신발장 / 영림 중문) = 벽 도어 → 보존.
     - 나머지 메시 중 어떤 hide-target bbox 안에 xz 중심 (SLACK ±20cm) + y 중심 (±50cm) + 사이즈 (bbox + 80cm 이내) 모두 통과 → `_ppFurnsToHide` 등록
   - 결과: ~480 메시 hide 대상 (가구 동), 신발장·욕실·구조·벽 도어·콘센트는 보존.
2. **콘센트 외곽선** (`_initOutletOutlines`, 1 회): 각 콘센트 plate 마다 `THREE.BoxHelper(plate, 0xffe040)` 생성, depthTest false / opacity 0.95 / `box.raycast = function(){}` (Line threshold 1m 이 plate hit 가로채는 회귀 회피). PP 진입 시 visible=true / 종료 시 false.
3. **시각 효과**: hide 대상 메시 visible=false (이전 visible 상태 `m.userData._ppPrev` 보존). 콘센트 outline 전부 표시. 우상단 `🔌 전원 계획 모드` 주황 배지 표시.
4. **SHIFT-aim 동작 변경** (`minimap.js _updateAimLabel`):
   - PP 모드 + SHIFT 미누름 → 콘센트만 라벨 (방·문·벽·창·가구 모두 무시).
   - PP 모드 + SHIFT 누름 → 콘센트 + **벽** 라벨 (사용자 요청, 벽 번호 식별용).
   - 콘센트 hit 시 라벨 형식: `콘센트 N: <라벨> (<구>구[, 방수]) • 높이 ## cm` (높이는 spec.y * 100).
5. **미니맵 배지 변경** (`minimap.js drawNumberOverlay`):
   - 각 배지에 `cat: 'room' / 'door' / 'furn' / 'wall' / 'win'` 필드.
   - PP 모드 활성 시 `cat === 'wall'` 만 hover-spread / 일반 배지 / 콜아웃 그림 — 다른 카테고리 모두 숨김. 결과: PP 모드에서 미니맵에 벽 번호 (43 개) 만 표시.

복원 (`setPowerPlanMode(false)`): 메시 visible 복원 / outline visible=false / 배지 숨김 / `window._ppVisibleFurnIdxs = null` (SHIFT-aim 가구 라벨 모두 복원).

#### B. `outlets.js` 분리 (CL 50383)

이전 OUTLETS 데이터 + buildOutlet IIFE 가 `index.html` 인라인 2 안에 있던 것을 별도 `outlets.js` (~165 줄) 로 분리. 사용자 요청 — 콘센트 배치만 자주 수정되므로 단일 파일에 격리.

**로드 순서**: `vendor/three.min.js` → 인라인 1 (layout 상수·scene·makeLambert) → **`outlets.js`** (OUTLETS 평가·buildOutlet 실행) → `furniture.js` → 인라인 2 (POWER PLAN MODE 등) → `minimap.js` → 인라인 3 (animate). 클래식 스크립트 글로벌 공유로 `_outlets` / `OUTLETS` 가 후속 스크립트에서 참조됨.

#### C. 한국 220V Type-F 형태 (CL 50383 / 50390)

`buildOutlet` IIFE 가 각 콘센트 plate 와 그 위 cup·pin 메시 생성:
- **plate**: `BoxGeometry(W, plateH, PLATE_T=0.003)`. 1·3·4 구는 가로 = `W = 72mm × gangs`, `plateH = 120mm`. **2 구만 세로 — `W = 72mm`, `plateH = 144mm`** (사용자 요청 CL 50390).
- **cup**: 각 gang 중심에 `CircleGeometry(CUP_R=23mm)` 평면 원 (matCup 살짝 어두운 회색 #c8c8c8), plate 전면 z=+0.0002.
- **pin**: cup 위 `CircleGeometry(PIN_R=2.2mm)` 둥근 핀 홀 2 개 (matPin #1a1a1a), 가로 간격 19mm (PIN_DX=±0.0095), z=+0.0004.
- **벽으로부터 돌출**: `CLEARANCE = 0.035m` + `PLATE_T/2 = 0.0015m` ≈ 37mm (CL 50398: 사용자 요청 +2cm 추가 돌출).
- **face / roty**: spec.face = 'N'/'S'/'E'/'W' → plate 의 roty (Y 회전) 와 z/x 오프셋. 벽 내면 좌표 (spec.x/z) + face 방향 off 만큼 plate 가 실내로 돌출.

#### D. 콘센트 배치 현황 (26 항목)

각 콘센트의 위치·구수·종류는 [`POWERPLAN.md`](./POWERPLAN.md) 의 방별 표 참조. 주요 패턴:

- **상하 페어** (사용자 패턴 — y=1.80 상부 + y=0.40 하부, 2 구 세로):
  - 벽 81 (주방 좌측, x=5.22), 벽 94 (주방 우벽, z=2.60), 벽 107 (창고2 남벽 좌측, x=0.65)
- **욕실 방수형** (`kind: 'wet'`): 거울수납장 안쪽 (1.45m, 2구) / 비데용 (0.40m, 1구) / 휴지걸이 좌하 (0.40m, 1구)
- **숨김 위치 (가구 뒤·캐비닛 안)**: 냉장고 뒤 (벽 106, 0.40m) — 사용자가 의도한 가전 직배선 위치. 거울수납장 안쪽 1.45m — 헤어드라이어/면도기 등 욕실 가전 격리.

#### E. 주요 CL 이력

- CL 50372: CLEARANCE 5mm → 15mm (1cm 추가 돌출, 초기 PP 작업 전)
- CL 50376~50382: PP 모드 (1 키 토글, 후 CL 50974 에서 2 키로 변경) 추가. 가구 hide / outlet outline / aim 라벨 + 높이 표시. 욕실 가구 visible 정책 정착.
- CL 50383: 한국 Type-F 형태 + outlets.js 분리 + 일괄 OUTLETS 추가/이동.
- CL 50384/50387: PP 모드 도어 분류 — 캐비닛 도어 hide / 벽 도어 보존 (DOOR_SLACK ±5cm).
- CL 50386: PP+SHIFT 시 벽 번호 표시.
- CL 50389: PP 미니맵 — 벽 번호만 표시 (cat 필터).
- CL 50390: 2 구 세로 배치 (한국 Type-F 세로 2 구).
- CL 50398: CLEARANCE 15mm → 35mm (+2cm 추가 돌출).
- CL 50402: [`POWERPLAN.md`](./POWERPLAN.md) 신설.
- CL 50403: DESIGN.md / CLAUDE.md 의 PP 모드·outlets.js·Type-F 반영.
- CL 50404 ~ 50408: 코드 위생 리팩토링 — H1 (휴리스틱 상수 hoist) / H2 (isPreserved 헬퍼) / H3 (PP+SHIFT 분기 set 일반화) / M1 (gangLayout 함수) / M2 (face lookup table).
- CL 50409 / 50410: PP 모드 → `powerplan.js` 분리 (S1) + visIdxs 캐시 (M3).
- CL 50411: outlets.js `_outletStats()` 콘솔 헬퍼 (L4).
- CL 50412: 어셔션 시각 띠 + console.assert/warn monkey-patch + [PP] 어셔션 (L7/S2).
- CL 50413: outlets.js 헤더 표 정정 (L1) + cup/pin Z 오프셋 named const (L8).
- CL 50414: 죽은 ROOM_PROFILE / VARIANT 참조 정리 + AGENT.md 빌드 구성 갱신 (M4).
- CL 50415: powerplan.js _ppBadge lazy 조회 (L5).
- CL 50416: powerplan.js parseInt → Number (L2).
- CL 50417: DESIGN.md CL 갭 안내 + 최근 리팩토링 CL 이력 추가 (L6).
- CL 50418: PAL.mat 구조 머티리얼 단일 원천 alias (S3).
- CL 50419: outlets.js [O] 데이터 init-time 검증 어셔션 (S4) — face/gangs/x/y/z/kind 범위 검사.
- CL 50420: powerplan.js 도어 카테고리 메타 캐시 — _doors[i].category = 'wall'|'cabinet' (S5).

상세 배치 변경(추가/제거/이동) 은 `p4 describe -s <CL>` 또는 `POWERPLAN.md` §"변경 요약" 참조.

#### F. 코드 위생 / 자동 검증 정책 (현재 상태)

리팩토링 라운드 이후 PP 모드 + outlets 시스템의 코드 품질·검증 인프라 정리:

**모듈 분리**:
- `outlets.js` ← OUTLETS + buildOutlet + gangLayout + face lookup + _outletStats
- `powerplan.js` ← PP 모드 (캐시·outline·visIdxs·토글 키)
- `index.html` 인라인 2 ← 가구 IIFE 외 / 벽지·키친핏·외부문·신발장·중문·어셔션 시각 띠
- 통합 PAL.mat alias 로 구조 머티리얼 단일 원천 (mWall 등)

**자동 검증 시스템** (auto-check on init/toggle):
- `[M]` `[P]` `[U]` `[CC]` (minimap.js) — 인덱스 일관성 / FURN_REGISTRY ↔ 배열 / FURN_META ↔ 배열 / 가구 충돌
- `[O]` (outlets.js) — OUTLETS face/gangs/좌표/kind 범위 검사
- `[PP]` (powerplan.js) — _ppFurnsToHide 합리적 범위 / _ppOutlines = _outlets 일치
- 모두 화면 상단 빨간 띠 (`#assert-banner`) 에 표시 — console.assert / console.warn monkey-patch 로 자동 후크

**콘솔 헬퍼** (사용자가 콘솔에서 수동 질의):
- `_inspect(48)` / `_gap(48,49)` / `_listRoom('욕실')` (minimap.js)
- `_outletStats()` (outlets.js) — total / totalGangs / byRoom / byKind 반환

**카테고리 메타** (디버그·외부 조회용):
- `_doors[i].category = 'wall' | 'cabinet'` (PP 캐시 init 시 자동 부착)
- `cat: 'room' | 'door' | 'furn' | 'wall' | 'win'` 미니맵 배지 필드 (PP 모드 필터링)

### 3.7. 변경 시 주의점

**인덱스 일관성** (어셔션이 자동 검증 — `[M]` 길이, `[P]` spec ↔ 배열, `[U]` `FURN_META` ↔ 배열, `[CC]` 가구·벽 충돌)
- `_doors[]` 푸시 순서가 **미니맵 `DOORS[]` 배열 순서와 1:1 일치**해야 함 (SHIFT 조준 라벨이 `ROOMS.length + i + 1` 로 인덱스 계산).
- `FURNITURE`, `FURNITURE_BBOX`, `WINDOWS`, `WINDOWS_BBOX`, `WINDOWS_H`, `WINDOWS_Y0`, `FURN_META` 모두 동일 — 인덱스 일관성이 SHIFT 라벨·치수·미니맵 배지 정확성의 전제.

**좌표/리터럴 단일 원천**
- 그리드 상수 6 개 + `zLR2 = 3.5` 로 단일화 (항목 A).
- 미명명 리터럴 (`0.9`, `0.6`, `0.10`, `0.20` 등) 은 3D + 벽지 + 걸레받이 + 미니맵 4~5 곳 동기화 필요.

**신규 항목 추가 시 동기 위치**
- 문: 3D 빌더 IIFE (`_doors.push`) + `minimap.js` 의 `DOORS[]` 같은 인덱스
- 가구: `defineFurniture(spec, build)` 또는 기존 IIFE + `minimap.js` 의 `FURNITURE[]` + `FURNITURE_BBOX[]` + **`furniture.js` 의 `FURN_META[id]`**
- 창: 3D 빌더 IIFE + `minimap.js` 의 `WINDOWS[]` + `WINDOWS_BBOX[]` + **`WINDOWS_H[]` + `WINDOWS_Y0[]`** (parallel)
- 콘센트: `index.html` 의 `OUTLETS` 배열에만 추가/수정 — `buildOutlet()` 가 자동으로 mesh 생성·`_outlets[]` 등록·SHIFT 조준 검출 활성화.

**카탈로그·설정 단일 원천 (변경은 한 곳만)**
- 텍스처: `TILE_CONFIG` / `WALLPAPER_CONFIG` 만 수정. 빌더 함수 본문은 손대지 않음.
- 조명: `LIGHTING.rooms[i]` (방별) / `LIGHTING.ambient`/`sun` (전체).
- 우드톤: `PAL.wood.*` (마이그레이션된 가구만; 미마이그레이션은 IIFE 인라인).

**가구 마이그레이션 시**
- `spec.id` 를 가구 인덱스 + 47 와 일치시킴 (가구 추가/삭제로 글로벌 `@FURN#` 번호가 시프트되어도 키는 인덱스 위치 유지).
- `spec.name` 은 `FURNITURE[id-47][2]` 와 글자별 일치 — `[P]` 어셔션이 자동 검증.

**민감정보 / GitHub 미러**
- 모든 변경 후 `~/bin/mirror-to-github.sh` 호출 (P4 워크스페이스에서 작업 시).
- 식별 정보 (단지·계약자·거래처·금액·외부 파일명) 추가 절대 금지 — 키워드 audit 가 차단하지만 사람·LLM 모두 commit 전 [PRIVACY.md](./PRIVACY.md) 체크리스트 확인.

## 4. 시행착오 / 교훈

여기서는 작업 중 마주친 비명시적 함정·우회·결정 근거를 기록한다. “이전에 한 번 시도해봤다가 다시는 그렇게 하지 말 것” 같은 신호를 보존하기 위함.

### 4.1. 처음 시작 시 로컬-depot 동기 미스 (CL 49691 이전)

**문제**: 첫 read 시 `index.html` 이 750 줄로 보였지만, `p4 fstat` 결과 `haveRev=22, headRev=158`. depot 의 최신은 4 273 줄(약 6 배 큼) 이었다. 처음 작성한 DESIGN.md (CL 49689) 는 stale 한 rev 22 기준이라 “창문 없음 / 욕실 위생기구 없음 / 천장 없음” 같은 현실과 다른 한계 항목이 들어갔다.

**해결**: `p4 sync index.html` 후 rev 158 기준으로 DESIGN.md 전면 재작성 (CL 49691).

**교훈**: P4 워크스페이스에서 작업 시작 전 `p4 fstat <file>` 으로 `haveRev` vs `headRev` 확인. 둘이 다르면 sync 후 시작.

### 4.2. P4 submit 의 다중 파일 인자 제약

**문제**: 항목 A 첫 서브밋 시 `p4 submit -d "..." index.html DESIGN.md` 가 `Missing/wrong number of arguments` 로 실패. P4 submit 은 단일 파일 인자만 받는다.

**해결**: 파일 인자 없이 `p4 submit -d "..."` 하면 default changelist 의 모든 opened 파일이 함께 submit 됨. `p4 opened` 로 사전 확인.

**교훈**: 서브밋 직전 `p4 opened` 로 default CL 의 파일 목록을 확인하고, 파일 인자는 생략.

### 4.3. K (data-driven) 의 점진 적용 결정

**문제**: 항목 K 의 이상적인 구현은 29 개 가구 IIFE 모두를 `defineFurniture(spec, build)` 패턴으로 변환. 그러나 각 IIFE 가 자기만의 헬퍼 함수·로컬 const·중첩 구조를 갖고 있어, 일괄 변환은 회귀 위험이 큼 (CL 한 번에 29 개 변환 ≈ 수천 줄 diff).

**해결**: 인프라(`FURN_REGISTRY` + `defineFurniture`) 만 도입하고, 가장 단순한 박스 가구 3 개(@FURN#47 드럼세탁기, @FURN#48 침대, @FURN#49 책상) 를 파일럿 변환. 신규 가구는 패턴 우선 적용을 컨벤션화.

**교훈**: “전부 또는 전무” 보다 “인프라 + 대표 사례” 가 점진 마이그레이션에 안전. 어셔션 §P 가 마이그레이션·미마이그레이션이 공존해도 자동 검증 가능하게 한 것이 결정적.

### 4.4. L (재료 팔레트) 도 같은 패턴

**문제**: 150 개 인라인 `MeshLambertMaterial` 호출 중 색상 중복은 최대 3 회 — 일괄 PAL 마이그레이션의 ROI 가 낮았다.

**해결**: PAL 인프라 + `makeLambert/makePhong` 헬퍼 + 변경 빈도 높은 5 개 사이트(우드톤 4 + 가전 외관 + 세탁기 도어) 만 마이그레이션.

**교훈**: 사용 빈도가 균등하게 산재한 인라인 정의는 “전부 마이그레이션” 의 가치가 크지 않음. 자주 함께 변하는 그룹만 정리.

### 4.5. 미니맵 정적 레이어 캐싱 시 컨텍스트 인자화 (항목 D)

**문제**: 기존 `drawBadge` / `drawNumberOverlay` 가 IIFE 의 `ctx` 변수에 클로저로 결합돼 있어, 오프스크린 캔버스에 같은 코드를 적용할 수 없었다.

**해결**: 두 함수 시그니처에 첫 인자로 `c` (컨텍스트) 추가. 본문 내부 `ctx.foo` → `c.foo` 일괄 치환. 호출 사이트도 `drawBadge(c, …)` 로 갱신.

**교훈**: IIFE 안의 클로저-결합 함수를 재사용할 일이 생기면, 의존성을 명시 인자로 끌어내는 것이 가장 단순한 일반화.

### 4.6. 가구 높이 스캔 휴리스틱 (5b)

**문제**: 4-요소 BBox 가구의 높이를 자동 추정해야 하는데, `scene.traverse` 결과가 furniture 메시뿐 아니라 인접한 벽·바닥·천장 슬라브도 포함. 단순히 “xz 중심이 BBox 안” 조건만 쓰면 인접 벽이 휘말려 높이가 ~CH 로 잘못 계산.

**해결**: 추가 휴리스틱 — 메시의 XZ 범위가 (BBox 폭 + 0.30 m) 보다 크면 스트럭처로 간주하고 제외. 100 % 정확하지는 않지만 대부분의 케이스 처리.

**교훈**: 메시-기반 자동 추정은 휴리스틱과 함께 가는 것이 현실적. 정확도가 부족한 가구는 사용자 보고 후 spec 으로 명시(K 마이그레이션) 또는 BBox 6-요소화로 해결.

### 4.7. SHIFT 조준 라벨의 경계 깜빡임 (CL 49724)

**문제**: 가구 가장자리에서 크로스헤어 1 px 이동 시 raycaster `hits[0]` 가 furniture mesh ↔ floor slab 을 토글. `_getAimInfo` 결과가 가구 ↔ 방을 매 프레임 번갈아 반환해 라벨/치수 sprite 가 시각적으로 깜빡였다.

**해결**: 시간 기반 hysteresis (`_stabilizedAim`, `AIM_HOLD_MS = 220`). 첫 조준은 즉시 채택 (반응성), 이후 다른 후보로의 전환은 후보가 220 ms 연속 유지될 때만. 깜빡이는 후보는 카운트가 매번 리셋되어 절대 채택 안 됨.

**교훈**: raycaster 의 first-hit 기반 분류는 본질적으로 경계에서 불안정. 사용자 피드백으로 발견되기 전엔 “정상 동작” 으로 오인되기 쉽다 — 깜빡임 없이 바로 잡힐 때만 “쓸 만함” 의 기준선. 시간 기반 안정화는 거의 항상 필요.

### 4.8. 치수 sprite 와 모서리 line 의 z-order

**문제**: 라벨 sprite 와 모서리 line 을 `_dimGroup` 에 함께 넣었더니, 카메라 각도에 따라 line 이 sprite 위에 그려지는 경우가 발생.

**해결**: line 의 `renderOrder = 998`, sprite 의 `renderOrder = 999`. `depthTest: false` 와 함께 명시적 순서로 sprite 가 항상 위에. 추가로 sprite 캔버스에 불투명 배경 + 색 테두리를 줘 시각 분리.

**교훈**: Three.js 의 sprite/line 같이 다른 렌더 패스에 속한 요소를 함께 보일 때는 `depthTest:false + renderOrder` 조합이 가장 단순한 정답.

### 4.9. 텍스처 절차 생성의 파라미터화 (항목 Q)

**문제**: TILE 텍스처 생성 코드 안에 `0.020+Math.random()*.040` 같은 “lo + random*range” 패턴이 5 종 있었다. 단순히 모든 매직 넘버를 const 로 끌어내면 가독성이 더 떨어짐.

**해결**: `[lo, hi]` 튜플 형태로 통일 — `noiseAlpha: [0.020, 0.060]`. 빌더 본문에서 `lo + random*(hi-lo)` 로 풀어 쓴다. 그래서 cfg 객체가 일관된 “range 표기” 만 갖는다.

**교훈**: 절차적 코드의 매직 넘버를 끌어낼 때는 표기 자체를 의미 단위로 일관화. 단순 라벨링은 가독성이 안 오른다.

### 4.10. 어셔션의 효용

**관찰**: §M / §P 어셔션은 “현재 코드는 통과” 상태로 항상 시작한다 — 다시 말해, 이미 정확한 코드에 대한 사후 검증. 그러나 그 후 LLM 변경 한 번 한 번이 어셔션을 깨뜨릴 때마다 콘솔 경고로 즉각 발각된다. CL 49724 의 SHIFT 깜빡임이 어셔션으로는 잡히지 않았던 이유는 “인덱스 일관성” 검증이지 “시각 안정성” 검증이 아니기 때문.

**교훈**: 어셔션은 “수정 직후 발각” 에 강하지만 “시각/UX 회귀” 에는 무력. 시각 회귀는 디버그 모드(`?debug`) 와 사용자 피드백 루프로 보완해야 한다.

### 4.11. 빠른 시각 검증 채널의 부재

**문제**: 모든 작업이 사용자가 브라우저에서 직접 확인하기 전엔 “혹시 깨졌을까?” 의 잔불안. LLM 측에서 자동 시각 검증이 불가능.

**완화**: 디버그 모드(`?debug`) + 어셔션(§M/§P) + 비트-동일 보존을 변경 원칙으로 일관 유지. 변경 후 사용자 피드백을 빠르게 받아 보정.

**교훈**: 단일 HTML 뷰어 환경에서 LLM 자동 검증은 한계가 명확. 사용자 피드백 사이클을 짧게 가져가는 게 최선.

### 4.12. 가구 삭제로 인한 글로벌 `@FURN#` 시프트 (CL 50227)

**문제**: 서재 책꽂이 5 → 3 으로 줄이는 과정에서 `@FURN#66` (책꽂이 3) / `@FURN#68` (책꽂이 5) 두 항목 제거 → `@FURN#69`+ 의 모든 후속 가구 ID 가 -2 시프트. 변경해야 할 파일 6 곳:
1. `furniture.js` `FURN_META` (id 필드 + 항목 자체)
2. `furniture.js` 책꽂이 IIFE (`makeBookcase` 호출 5→3)
3. `furniture.js` 후속 가구의 `@FURN#NN` 앵커 주석 7 개
4. `minimap.js` `FURNITURE[]` (3 행 + 후속 주석)
5. `minimap.js` `FURNITURE_BBOX[]` (5 → 3 + 후속 주석)
6. `minimap.js` `DOORS[]` 주석의 `@FURN#NN` 참조 + 헤더 주석 + `i=N → @FURN#M` 표기

**놓친 것**: 후속 CL 50233 에서 발견 — `defineFurniture(id:75, ...)` 에서 id 가 시프트되지 않고 75 로 남아 있어 `[P]` 어셔션 경고 (`spec.id=75 가 FURNITURE[] 범위 밖`). spec.id 까지 포함해 5 곳 모두 동기화 필요.

**교훈**: 가구 삭제·추가는 글로벌 `@FURN#NN` 번호의 시프트 효과를 동반하므로 비용이 크다. 시프트가 필요할 때:
- spec.id 를 포함해 grep 으로 모든 후속 ID 참조를 빠짐없이 추출
- §P 어셔션이 spec.id 누락을 발견 — 첫 페이지 로드 시 콘솔 확인
- DESIGN.md/CLAUDE.md/MEMORY.md 의 `@FURN#NN` 참조도 함께 업데이트
- `FURN_META` 키 문서 (`'47..73'` 같은 표기) 도 갱신

차후 `@FURN#NN` 같은 번호 의존 대신 라벨 텍스트나 키워드 기반 참조 컨벤션도 고려.

### 4.13. 민감정보 redact 의 어려움 (CL 50244)

**문제**: 작업 중 한국어 문서에 단지명·시공사명·계약 금액·외부 파일명이 자연스럽게 누적됨 (특히 MEMORY.md 가 “사람용 메모” 라는 명목 하에 풍부한 컨텍스트 축적). public GitHub repo 결정 후 모든 파일 전수 audit 필요.

**해결**:
- `grep` 기반 일괄 검사 후 5 개 파일 (MEMORY.md / DESIGN.md / CLAUDE.md / AGENT.md / furniture.js 일부) 전반 sanitize.
- `PRIVACY.md` 단일 정책 원천 + LLM 컨텍스트 (`CLAUDE.md`/`AGENT.md` 상단 경고 박스).
- `~/bin/mirror-to-github.sh` 가 push 직전 `~/.house-model-sensitive-keywords.txt` 와 git diff 를 grep 매칭 → exit 2 차단.

**교훈**:
- 처음부터 “이 정보는 public 에 가도 OK?” 를 매 commit 시 자문하는 습관 필요.
- “편의를 위해 한 번만” 식의 식별 정보 추가는 GitHub 의 영구 히스토리 캐시 때문에 회수 불가.
- LLM 컨텍스트(CLAUDE.md/AGENT.md) 는 매 세션 시작 시 자동 로드되므로 상단의 경고 박스가 가장 효과적인 “미연 방지” 메커니즘.

### 4.14. P4 → GitHub 미러 자동화 (CL 50248)

**문제**: P4 ↔ Git 동기화를 사람이 매번 손으로 하면 빠뜨림 → GitHub 가 뒤처짐 또는 잊혀진 commit 발생.

**해결**: `~/bin/mirror-to-github.sh` 단일 호출로 5 단계(rsync → git-only 복구 → 변경 점검 → 키워드 audit → commit + push) 자동화. CLAUDE.md/AGENT.md 워크플로우 섹션이 LLM 에이전트에게 “매 `p4 submit` 직후 호출” 의무화.

**놓친 것**: 첫 운영 시 `p4 describe` 출력 파싱 (`sed -n '4p'`) 가 빈 줄을 잡아 commit message 에 빈 description 들어감. `awk 'NR>=3 && NF { sub(/^[\t ]+/, ""); print; exit }'` 로 보정 후 force-push 로 amend.

**교훈**: 출력 파싱 스크립트는 첫 실제 운영 데이터로 한 번 검증해야 함. P4 의 `describe -s` 출력 형식 (`Change … by …` / 빈 줄 / `\t설명` / 빈 줄 / 상세) 같은 외부 도구 의존은 종종 실수 유발.

### 4.15. 미니맵 배지 hover-spread (CL 50276)

**문제**: 120+ 개 글로벌 식별 배지가 미니맵에 밀집되어 spiral 충돌-회피 레이아웃으로도 어느 번호가 어느 객체를 가리키는지 분간하기 어려움.

**해결**: 마우스 호버 시 주변 36 px 안에 실제 위치(tx,ty) 또는 배치 위치(bx,by) 가 있는 배지를 마우스 주변 64+ px 원 위에 균등 분포 — 굵은 흰색 리더 라인으로 실제 위치 점을 가리킴, 점선 가이드 원으로 호버 영역 표시, +2 px 확대 가독성.

**구조 변경**: `_staticTopCv` 캐시에서 배지 layer 제거 (타이틀 바만 캐시) → 매 프레임 `drawNumberOverlay(ctx)` 메인 ctx 에 동적 호출. `_badgeLayout` (spiral 결과) 은 여전히 1회만 계산되어 캐시.

**호버 검출**: 미니맵 캔버스가 `pointer-events:none` 이라 mousemove 리스너 직접 추가 불가 — `mc.getBoundingClientRect()` + 모듈 스코프 `_mouseX/_mouseY` (window mousemove 추적) 비교로 hover 상태 판정.

**교훈**: 정적 캐시는 절대 정적 데이터에만 적용 — 호버 같은 dynamic 측면이 도입되면 분리해야 함. 합쳐진 캐시는 한 번만 굽고 끝이라 인터랙션 추가가 어려움.

### 4.16. 영림 3연동 중문 — `_doors[]` 미닫이 시스템 (CL 50286 / 50289)

**문제**: 기존 `_doors[]` 는 회전형(swing/flap) 만 지원 — `pivot.rotation[axis]` 보간. 슬라이딩 도어 (3연동 중문) 에는 부적합.

**해결**: `kind:'slide'` 분기 도입. animate 루프에서 `kind === 'slide'` 면 `pivot.position[slideAxis]` 를 `slideOrigin → slideOrigin+slideOpen` 으로 보간. 회전형은 분기 다른 쪽으로 통과 — 기존 31 개 도어 동작 비변경.

**3연동 동기 토글**: `linkGroup` 필드. 같은 ID 공유 시 한 패널 클릭으로 전부 토글. `_toggleDoorAtNDC` 의 raycast 후 매칭 시 linkGroup 검사하여 일괄 isOpen 갱신.

**클릭 검출**: 미닫이 패널은 `THREE.Group` (글래스+프레임+간살+손잡이 조합) 인데 `intersectObjects` 의 default `recursive=false` 가 group 안 자식을 못 봄. `recursive=true` 로 변경 + hit.object 부모 체인을 거슬러 doorMesh (Group) 와 일치 검사. 기존 회전형은 doorMesh 가 leaf Mesh — 매칭 1번에 끝나므로 recursive=true 추가비용 무시 가능.

**교훈**: 인터랙션 시스템 확장 시 기존 path 영향 없이 분기 도입 가능 — `kind` 같은 discriminator 필드와 if-else 만으로. 한편 raycast 의 recursive flag 같은 기본값은 단일 도어 시스템에서는 fine 했으나 group 도입 시 재검토 필요.

### 4.17. 중문 위치 변경에 따른 z 범위 단축 (CL 50296)

**문제**: 중문을 신발장 좌측 (x=8.86) 으로 이동 시, 1차 위치 (x=7.8) 의 1.5 m 폭 (z=2.7~4.2) 그대로 유지하려니 양 끝이 서재 벽 (z=2.7) / 창고 벽 (z=4.2) 의 솔리드 구간 (x=8.7~10.5) 과 충돌. 1차 위치는 양 끝이 도어 갭 (x=7.8~8.7) 이라 1.5 m 가능했으나, 신발장 부근은 솔리드 벽.

**해결**: z 범위를 벽 내면 사이로 단축 — `zM1+WT/2` (2.76, 서재 벽 내면) ~ `zM2-WT/2` (4.14, 창고 벽 내면 = 신발장 후면) → 1.38 m. panelW 0.50→0.46 (auto-derived `(openZ1-openZ0)/3`).

**slideOrigin/slideOpen 자동 적응**: `_doors.push` 의 slideOrigin/slideOpen 값이 `openZ0 + panelW * k` 형식이라 panelW 변경에 자동 적응 — `_doors.push` 코드 변경 불필요.

**교훈**: 위치 의존 dimension (벽 내면 거리, 인접 가구 등) 은 grid 상수가 아니라 계산식 으로 표현해 두면 위치 이동 시 자동 적응. 하드코딩보다 식이 안전.

### 4.18. 현관 녹색 영역의 중문 정렬 (CL 50302)

**문제**: 중문 부착 후 녹색 현관 슬라브 (x=8.7~10.5) 의 서측 부분 (x=8.7~8.896) 이 중문 서측 (집 안) 에 노출 — 사용자가 의도한 vestibule 디자인과 불일치 ("중문까지만 녹색이고 중문 너머에서는 안 보여야").

**해결**: mEntry 슬라브 west edge 8.7→8.896 (중문 동측 패널 동면). 노출된 영역 (x=8.7~8.896, z=2.7~4.0) 은 `buildTileFloor()` 에 quad 추가해 타일 보충. 단차 라이저 두 개 (서측·북측) 위치 동기.

**후속 (CL 50963)** — 신발장 정면 앞 **중문 디딤판** (사용자 요청, "신발장 방향에서 볼 때 중문 아래쪽 바닥이 신발장 앞쪽으로 30 cm 더 튀어나오도록"). 중문 동면 (x=8.896) 에서 동측으로 +30 cm (→9.196), 신발장 (z=3.77~4.14) 남측 z=2.7~3.77 구간에 한정. 영향:
- `buildTileFloor()` quad 추가: x=8.896~9.196, z=zM1~3.77 (디딤판 자체).
- mEntry 슬라브 1 → 2 분할 (디딤판 동측 + 디딤판 북측 = L-shape).
- 라이저: x=8.896 단축 (z=3.77~4.0 만), x=9.196 신설 (z=2.7~3.77, 동측 단차), z=3.77 신설 (x=8.896~9.196, 북측 단차 = 신발장 정면 향).
- 신발장 (@FURN#50) 본체와 정확히 z=3.77 에서 접함 — 중첩 없음, 어셔션/충돌 영향 없음.

**교훈**: 마감재 (바닥색 등) 도 가구·구조 변경 시 동기화 필요. "중문이 vestibule 의 boundary" 같은 디자인 의도는 시각적 cue (바닥색) 으로 강화돼야 일관됨.

### 4.19. 배지 번호 시프트의 시간적 비안정성

**현상**: DOORS 또는 FURNITURE 추가 시 후속 카테고리 배지 번호 자동 시프트. CL 50289 에서 영림 중문 3 panels 추가 → DOORS.length 33→36 → 가구/벽/창문 배지 모두 +3 시프트.

**영향**: 사용자가 옛 CL 의 "벽 96", "가구 52" 등을 참조 시 현재 배지가 다를 수 있음. 예: CL 50280 시점 "벽 96" = corridor 벽 [10.5, 3.75, 10.5, 4.2], 현재 "벽 96" = 다른 벽.

**완화책**:
- 코드 anchor `@FURN#NN` 은 FURN_META id (안정) 로 매칭 — `@FURN#50` 은 항상 신발장.
- 배지 번호 의존 표현 회피 — "가구 52" 대신 "신발장" / "@FURN#50".
- DESIGN.md / CL 설명에서 라벨 텍스트 함께 기재 ("벽 96 (corridor 벽 z=3.75~4.2)") 하면 시프트 후에도 식별 가능.
- 미래 변경 시 DOORS / FURN 추가는 가능한 합쳐서 한 번에 — 변경 횟수 줄이기.

**교훈**: 자동 인덱싱은 편리하나 시간적 안정성 문제. 사용자 기억 / CL 설명 / 외부 참조 문서가 옛 번호로 고정될 위험. 안정 식별자(@FURN#id) 와 배지(runtime) 의 차이를 문서에 명시해야 함.

### 4.20. SHIFT-aim 다중 라벨 동시 표시 — 단일 + hysteresis 폐기

**문제**: 한 위치 (예: 문 위) 에 여러 카테고리가 적용 (문 + 벽 + 방) 될 때, 단일 라벨 시스템은 우선순위 첫 번째만 표시. 첫 hit 가 mesh 경계에서 jitter 하면 라벨이 깜빡임 (예: 문/벽 사이). 사용자 요청 (2026-05-08): "벌룬 사이를 전환하며 보여주지 말고 현 위치에 표시해야 하는 벌룬을 모두 표시".

**해결**:
- `_getAimInfo()` (단일 매치 반환) → `_getAllAimInfo()` (배열 반환) 으로 교체. 적용되는 모든 카테고리 (문/콘센트/가구/창문/벽/방) info 객체를 배열에 push.
- `#aim-label` 을 컨테이너로 변환 (배경/패딩 제거) + 자식 `.aim-item` 요소가 실제 라벨 박스. CSS 의 type 컬러 (`t-room`/`t-door`/etc.) 를 `.aim-item` 으로 옮김.
- `_updateAimLabel()` 에서 `innerHTML = '<div class="aim-item t-room">...</div><div class="aim-item t-wall">...</div>...'` 로 stacked 렌더.
- 220 ms hysteresis (`_stabilizedAim`, `AIM_HOLD_MS`) 제거 — 카테고리 전환이 사라져 hold 불필요. 매 프레임 raw 결과 그대로 렌더.
- 치수 sprite (`_showDimensions`) 는 primary (배열 첫 번째 — 가장 구체적) 매치만 적용. 여러 가구·벽 sprite 가 한 화면에 동시 떠다니는 시각 잡음 회피.
- 콘센트 outline highlight (`_showOutletHighlight`) 는 매치 배열에서 outlet 항목 검색해 적용.

**우선순위 (배열 순서, 가장 구체 → 가장 일반)**:
1. 문 — 첫 hit mesh 가 _doors[i].pivot 후손 (mesh 식별)
2. 콘센트 — 첫 hit 가 _outlets[i].plate 후손 (mesh 식별, 문과 상호 배타)
3. 가구 — hit 점이 FURNITURE_BBOX 안 (5mm 인셋)
4. 창문 — hit 점이 WINDOWS_BBOX 안
5. 벽 — hit 점이 WALLS segment 15cm 이내
6. 방 — hit 점이 ROOMS 사각형 안 (역순, 가장 작은 박스 우선)

**교훈**: 단일 슬롯 + hysteresis 는 "한 번에 하나만 보여주는 UI" 전제에서 합리적. UI 모델을 "동시 표시" 로 바꾸면 hysteresis 자체가 무의미 — 시간 hold 로 푼 문제는 사실 "정보 손실 vs 깜빡임" 트레이드오프였음. 다중 표시는 정보 손실이 0 이라 깜빡임도 발생하지 않음 (각 카테고리는 자기 조건이 맞으면 보임/안 맞으면 사라짐, 전환 없음).


### 4.21. 모바일 터치 지원 (CL 50979)

**요청**: "모바일 환경에서 접근하면 [화면에] 3D 모델을 띄우고 손가락으로 스크롤(=카메라 이동)하고, 핀치로 줌인/줌아웃, 그리고 미니맵 + 키바인딩 알림 숨기기로 동작하도록".

**감지**: `IS_MOBILE = ('ontouchstart' in window) && (window.innerWidth <= 1024)`.
- 둘 다 true 일 때만 모바일 분기 (터치 노트북 제외, ≤1024px 는 일반적 폰·태블릿 portrait/landscape 커버).
- 한 번 init 시 평가 — 화면 회전 등 동적 변화 미감지 (필요 시 새로고침).

**UI 변화 (모바일만)**:
- `#ui` (키바인딩 안내) 숨김 — 모바일은 키보드 없음.
- `#minimap` + `#minimap-legend` 숨김.
- `#power-plan-badge` 등 다른 배지는 그대로 (PP 모드 진입은 키보드 필요해서 모바일에서 사실상 작동 안 함, 배지가 떠도 무해).

**터치 핸들러 (3 종)**:
1. **한 손가락 드래그 → 카메라 이동 (WASD 대체)**: touchstart 시 시작 좌표 기록 → touchmove 마다 누적 dx/dy 를 ±DRAG_MAX_R(80px) 로 정규화 → 전역 `_touchInput {x, y}` (-1..+1) 에 저장 → animate() 가 매 프레임 `_move.addScaledVector(_fwd, -_touchInput.y)` + `_move.addScaledVector(_right, _touchInput.x)` 로 합산. WASD 와 동일한 `_move` 정규화 + `WALK`/`FLY * dt` 스케일링 통과.
2. **두 손가락 핀치 → 시선 방향 전진/후진**: touchstart 시 두 손가락 거리 기록 → touchmove 마다 새 거리 계산, delta = newDist - oldDist → `delta * PINCH_SPEED(0.012)` 만큼 시선 방향(yaw·pitch 기반) 으로 즉시 이동. 휠 핸들러와 정확히 동일 패턴.
3. **한 손가락 짧은 탭 → 문 토글**: touchend 시 maxMove < 10px + elapsed < 300ms 면 `_toggleDoorAtNDC` 호출 (마우스 click 등가).

**경계 처리**:
- 핀치 종료 (2→1 손가락) 시 남은 손가락을 새 드래그 시작점으로 등록 — 핀치 후 한 손가락 떼면 즉시 카메라 점프 회피.
- touchcancel (시스템 인터럽트, 알림 등) → 모든 입력 상태 리셋.
- canvas CSS `touch-action: none` 추가 — 브라우저 기본 핀치줌·풀투리프레시·스크롤 차단 (자체 핸들러로 처리).
- viewport meta `user-scalable=no, maximum-scale=1.0` 추가 — iOS Safari 더블탭 줌 방지.

**데스크톱 영향**: 0. `IS_MOBILE === false` 면 모든 터치 코드 경로가 가드되어 등록 자체가 안 됨. 마우스/키보드/휠 핸들러는 그대로.

**알려진 제약**:
- 모바일에서 Space (모드 토글), R (리셋), Q/E (눈높이), M (미니맵 재표시), 1/2 (PP/미팅 토글), SHIFT (조준 라벨) 모두 사용 불가 — 키보드 의존 기능. 필요 시 화면 버튼 추가 (후속 요청 시).
- 화면 회전 시 IS_MOBILE 재평가 안 됨 — 데스크톱 ↔ 모바일 사이 경계 (1024px 근처) 에서 회전 시 새로고침 필요.
- 1인칭 모드 진입 불가 (Space 키 필요) — 모바일은 항상 freeMode 에서 동작.

**교훈**: 데스크톱-only 인터랙션 (마우스 + 키보드) 을 가정한 코드에 모바일을 더할 때, 가장 안전한 패턴은 (1) 모바일을 별도 입력 채널로 모델링 (`_touchInput` 가상 조이스틱) → 기존 `_move` 합산 로직에 합류, (2) 데스크톱 코드 경로는 그대로 보존 (`IS_MOBILE` 가드). 기존 핸들러를 모바일용으로 "다용도화" 하는 것보다 추가가 안전.

### 4.22. 5/8 미팅 결정사항 모드 — PP 모드와 시각 효과 공유 (CL 50995)

**요청**: "5월 8일 현장 미팅에서 전원 콘센트·콘센트·조명 위치 및 수량, 난방 분배기·컨트롤러 교체, 중문 발디딤틀 크기 등을 결정. 숫자키 1을 눌러 이 결정들을 시각화하게 만들려고 합니다. 숫자키 1을 누르면 현재 2를 누르면 나오는 전원 계획처럼 가구를 모두 숨기고 전원 콘센트가 나타나도록 해 주세요."

**구조 결정**: 두 모드를 별도 토글로 유지하되 시각 효과는 공유.
- 키 `1` (Digit1) → `setMeetingMode(on)` (meetingmode.js 신규)
- 키 `2` (Digit2) → `setPowerPlanMode(on)` (powerplan.js, 기존)
- 두 모드 mutually exclusive (한 모드 켜면 다른 모드 자동 종료)
- 시각 효과는 `_applyOutletView(on)` 헬퍼 (powerplan.js 추출) 로 단일화

대안 비교:
- (A) 키 1 을 키 2 의 alias 로 → 두 키 같은 토글 → 미래 미팅 모드가 PP 와 다른 동작 (추가 시각화) 가질 때 alias 깨짐.
- (B) 미팅 모드 별 상태 + 별 시각 로직 (완전 복제) → 현재 동일 효과를 두 번 구현, 변경 시 동기화 부담.
- (C) 별 상태 + 시각 효과 추출 공유 ✓ → 추후 미팅 모드 자체 시각 (조명 강조 등) 추가 시 `_applyOutletView` 외에 합쳐짐. 의도 분리 + 코드 재사용.

**시각 효과 추출 (`_applyOutletView`)**: 기존 `setPowerPlanMode` 본문에서 가구 hide / outlet outlines / `_ppVisibleFurnIdxs` 갱신을 추출. 부수 효과로 `window._outletViewActive = on` 설정 — minimap.js 가 이전엔 `window.powerPlanMode` 직접 참조로 배지 필터·SHIFT-aim 분기를 했으나, PP/미팅 양 모드 공통 필터로 통일 (3 곳 갱신).

**Mutual exclusion 패턴**:
```js
function setPowerPlanMode(on){
  ...
  var meetingActive = !!window.meetingMode;
  var visualWasOn = powerPlanMode || meetingActive;
  if (on && meetingActive){
    // 미팅 → PP 전환: 미팅 플래그·배지만 정리, 시각은 유지
    window.meetingMode = false;
    var mBadge = document.getElementById('meeting-badge');
    if (mBadge) mBadge.style.display = 'none';
  }
  powerPlanMode = on;
  ...
  if (visualWasOn !== on) _applyOutletView(on);  // 합집합 전이에만 토글 — 깜빡임 회피
  ...
}
```
역방향(setMeetingMode) 도 대칭 구조.

**배지**:
- PP 모드 (`#power-plan-badge`): 주황 🔌 "전원 계획 모드 — 2: 종료"
- 미팅 모드 (`#meeting-badge`): 녹색 📋 "5/8 미팅 결정사항 — 1: 종료"
- 두 배지 같은 위치 (top:54px right:14px) — mutually exclusive 라 동시 표시 안 됨.

**향후 확장 계획** (사용자 결정사항 6개 카테고리):
1. ✅ 전원 콘센트 위치 및 수량 — 본 CL 에서 시각화 (PP 와 동일).
2. (전원 외) 콘센트 위치 및 수량 — 데이터/통신/스위치 등? 추가 데이터 필요.
3. 조명 위치 및 수량 — `CEILING_LIGHTS` 마커 강조 + 미팅 결정 반영.
4. 난방 분배기 교체 — 모델에 없음, 신규 메시 추가 필요.
5. 난방 컨트롤러 교체 — 모델에 없음, 신규 메시 추가 필요.
6. ✅ 중문 발디딤틀 크기 — CL 50963 에서 모델 반영 (별도 시각화 불필요, 모드 내에서 자연 보임).

추가 시각화는 `setMeetingMode(on)` 본문에 `_applyOutletView(on)` 호출 후 자체 함수 (`_applyMeetingExtras(on)` 등) 추가 형태 권장.

**교훈**: "두 키가 같은 동작을 한다" 의 자연스러운 해법은 alias 가 아니라 "두 모드가 같은 시각 효과 헬퍼를 공유" — alias 는 미래 분기 발생 시 깨지지만, 헬퍼 공유는 한 쪽이 분기해도 다른 쪽 영향 없음. UI 표면 (배지/키) 의 분리와 내부 효과의 공유는 직교 관심사.

### 4.23. 난방수 분배기 추가 — 5/8 미팅 결정사항 ① (본 CL)

**요청**: "그림은 한국 아파트에 설치된 난방수 분배기. 벽 94 를 정면으로 바라볼 때 아래쪽 바닥에 설치." (사진 참조)

**해석**:
- "벽 94" = 주방 우벽 (x=7.8, z=0~2.7) — 미니맵 wall 번호 기준 (배지 시프트 인지: 본 CL 후 가구 +1 → wall 번호 +1, 따라서 본 CL 이후엔 같은 벽이 "wall 95")
- "정면으로 바라볼 때" = 주방 내부에서 동쪽 (+x) 향함, 벽 면이 보이는 시점
- "아래쪽 바닥" = (a) 벽의 하단 (y small, 바닥 가까이), (b) 시야의 아래쪽 (z small, 남측 끝) 중첩 해석 — 둘 다 만족하는 위치 = 벽의 남단 floor-level 코너

**배치 (@FURN#74)**:
- x: 7.59 ~ 7.74 (벽 내면 x=7.74 부착, 깊이 15 cm 돌출)
- z: 0.11 ~ 0.61 (폭 50 cm, 주방 하부장 @FURN#52 z=0.66 의 5 cm 남쪽까지)
- y: 0.10 ~ 0.50 (바닥 +10 cm, 높이 40 cm)

**왜 이 z 범위**: 벽 94 (z=0~2.7) 의 사용 가능 floor area:
- z=0.06~0.66 (60 cm): 자유 (주방 외벽 z=0 wall 0.06m 두께 후 ~ 하부장 시작)
- z=0.66~2.64: 주방 하부장(우) @FURN#52
- z=2.64~2.7: 6 cm 잔여 (너무 좁음)
- → 첫 번째 60 cm 구간이 유일한 placement 후보. 5 cm 안전 마진 두고 z=0.11~0.61.

**기하학 (사진 단순화)**:
- 본체 manifold (BoxGeometry, 황동 톤 0xb89c5e, 50W × 40H × 15D cm)
- 상단 차단 밸브 2 개 (cylinder + 빨간 cap, z 양쪽 18 cm 오프셋)
- 하단 PEX 출력관 6 개 (얇은 노란 cylinder, 본체 아래 5 cm 노출, 균등 간격)
- 좌·우 메인 인입관 2 개 (회색 horizontal cylinder, 벽→본체)

각 메시에 `userData.kind = 'heatingDistributor'` 부착 — 향후 5/8 미팅 모드 (key 1) 에서 본 항목만 별도 강조 시각화 시 식별 가능.

**5/8 미팅 결정사항 6 카테고리 진행도** (메모리 `meeting-2026-05-08.md` 참조):
1. ✅ 전원 콘센트 — meetingmode.js (CL 50995, PP 와 동일 효과)
2. (전원 외) 콘센트 — 미진행
3. 조명 위치/수량 — 미진행
4. ✅ **난방 분배기** — 본 CL (@FURN#74, 시각화는 일반 furniture, 미팅 모드에서는 가구 hide 정책상 현재 안 보임 — 후속 CL 에서 보존 set 추가 필요)
5. 난방 컨트롤러 — 미진행
6. ✅ 중문 디딤판 — CL 50963

**알려진 제약**: 본 CL 에서는 단순히 가구로 추가만 함. 5/8 미팅 모드 (키 1) 진입 시 PP 모드와 동일하게 가구 hide 대상 → 분배기도 숨겨짐. 미팅 모드에서 항목별 보존 보이기를 위해선 별도 follow-up CL 필요 (분배기 + (장차) 조명 마커 + 난방 컨트롤러를 미팅 모드 보존 set 에 등록).

**교훈**: 미팅 결정사항 시각화 모드를 단계적으로 채울 때, "항목 추가" 와 "그 항목을 모드에서 보이게 하기" 는 분리된 작업. 사용자가 양쪽 다 의도하면 명시 필요; 본 CL 은 항목 추가만 — 사용자 후속 요청 시 보존 set 정비.

### 4.24. 미팅-only 가구 패턴 — `meetingOnly` 플래그 (본 CL)

**문제**: 난방 분배기 (@FURN#74, CL 51028) 가 주방 하부장(앞) (@FURN#51) 의 SE 코너 bbox 안에 위치해 [CC] 가구 충돌 경고 발생. 실제 설치 위치 (캐비닛 BEHIND 벽면 부착) 는 정상이고, 평소엔 캐비닛에 가려져 안 보이며 미팅 모드 (키 1) 에서만 확인하면 되는 것을 확인.

**해결 — `meetingOnly` 플래그 패턴**:
- `FURN_META[id].meetingOnly = true` 마킹.
- IIFE 에서 메시 생성 시 `userData.meetingOnly = true` + `mesh.visible = false` 초기화.
- `meetingmode.js _applyMeetingExtras(on)` (신규) 가 `userData.meetingOnly` 메시들 일괄 토글 (lazy 캐시 1 회 빌드).
- `setMeetingMode` 가 `_applyOutletView` 다음에 `_applyMeetingExtras` 호출 — outlet view 의 가구 hide 를 override.
- `setPowerPlanMode` 의 mutual exclusion 분기에서도 `_applyMeetingExtras(false)` 호출 — meeting → PP 전환 시 meeting-only 메시 재 hide.
- `minimap.js [CC] FURN-FURN` 검사: 한쪽이라도 `meetingOnly` 면 skip — 의도된 "BEHIND" 충돌 무시.

**상태 전이**:
| 진입 | distributor | 이유 |
|---|---|---|
| 시작 (모드 off) | hidden | IIFE 초기 visible=false |
| 키 1 (미팅) | **visible** | `_applyMeetingExtras(true)` override |
| 키 2 (PP) | hidden | `_applyOutletView` hide, meetingExtras 미실행 |
| 키 1 → 키 2 | hidden | `setPowerPlanMode` 가 `_applyMeetingExtras(false)` 호출 |
| 키 2 → 키 1 | **visible** | meeting setter 가 `_applyMeetingExtras(true)` 호출 |
| 모드 off | hidden | `_applyOutletView` 가 `_ppPrev=false` 복원 |

**향후 적용**: 5/8 미팅 결정사항 6 카테고리 중 추가 시각화 (난방 컨트롤러 신설 등) 도 같은 패턴 — `meetingOnly:true` 플래그 + `mesh.visible=false` 초기화. 캐시는 init 1 회 빌드라 가구 추가 시 자동 반영.

**교훈**: 가구가 "실제론 다른 가구 뒤/안에 숨겨져 있다" 는 의도를 모델에 표현할 때 (캐비닛 뒤 분배기 / 천장 안 덕트 등), bbox 충돌을 전부 정합화하려고 위치를 흔드는 대신 "의도적 겹침" 플래그 + 가시성 모드 조합으로 표현하는 것이 정직. [CC] 같은 정적 검사는 의도성을 알 수 없으므로 명시적 opt-out 플래그 (`meetingOnly`) 가 단순하고 안정.

### 4.25. 난방 분배기 위치 조정 — 벽 중앙 + 앞 30 cm (본 CL)

**요청**: "난방수 분배기를 벽 중앙으로 옮기고 앞으로 30 cm 당겨주세요."

**변경 (CL 51028 → 본 CL)**:
- z 중심: 0.36 → **1.35** (벽 94 의 z=0~2.7 중앙)
- x 범위: 7.59~7.74 → **7.29~7.44** (벽 내면 7.74 에서 앞 30 cm 당김)
- y 범위: 0.10~0.50 (불변)
- 본체 동측 (x=7.44) ↔ 벽 (x=7.74) 간 30 cm 갭 — 좌·우 메인 인입관 길이 6 cm → **30 cm** 로 자동 갱신 (`bbox[2]` 기준 계산).

**BEHIND 가구 변경**: 이전엔 주방 하부장(앞) @FURN#51 (z=0.06~0.66) BEHIND, 본 CL 후엔 주방 하부장(우) @FURN#52 (z=0.66~2.64) BEHIND. 둘 다 [CC] 검사는 `meetingOnly:true` 로 skip — 평소엔 캐비닛 가려져 있고 미팅 모드 (키 1) 에서만 가시.

**파일**: FURN_META[74] (pos/bbox/source) + FURNITURE/_BBOX (인덱스 27) + IIFE 의 메인 인입관 길이 산출.

### 4.26. 미팅 모드 진입 시 UI/미니맵 자동 숨김 (본 CL)

**요청**: "1키 누르면 미니맵, '아파트 3D 뷰어' 패널 숨겨주세요. 1을 다시 누르면 나타나야합니다."

**동기**: 미팅 모드 (키 1) 의 목적은 5/8 결정사항 항목 (콘센트·난방 분배기 등) 을 한 화면에서 검토 — 키바인딩 안내 (#ui) 와 미니맵 (#minimap, #minimap-legend) 은 검토 시 시각 잡음. 모드 진입 시 자동 숨김, 종료 시 자동 복원.

**구현 (`meetingmode.js _applyMeetingUI(on)`)**:
- `setMeetingMode(on)` 끝에 `_applyMeetingUI(on)` 호출.
- `on=true` → `display:none`, `on=false` → `display:''` (HTML 기본 = visible).
- 모바일 (`IS_MOBILE`) 에선 본 토글 skip — 모바일은 init 단계에서 이미 숨김 (CL 50979) 이라 다시 visible 로 만들면 모바일 정책 위반.
- `setPowerPlanMode` mutual exclusion: 미팅 → PP 전환 시 `_applyMeetingUI(false)` 로 복원 — PP 는 UI/미니맵 표시 유지 정책.

**상태 표**:
| 진입 | #ui / #minimap |
|---|---|
| 시작 (모드 off) | visible (HTML 기본) |
| 키 1 (미팅) | **hidden** |
| 키 1 → 키 1 (종료) | visible (복원) |
| 키 2 (PP) | visible (PP 는 미적용) |
| 키 1 → 키 2 (전환) | visible (mutual exclusion 분기에서 복원) |
| 키 2 → 키 1 (전환) | hidden |
| 모바일 | 항상 hidden (초기 정책 우선, 본 토글 skip) |

**알려진 한계**: 사용자가 M 키로 미니맵을 수동 숨김 한 상태에서 미팅 모드 진입·종료 시 → 종료 시점에 미니맵이 강제 visible 됨 (이전 M 토글 상태 미보존). 사용자 요청이 "다시 누르면 나타나야" 이므로 의도된 동작.

**교훈**: 모드별 UI 상태를 토글하는 패턴은 모바일 / 수동 토글 등 여러 진입점과 충돌 가능. "복원" 시점에 (a) 진입 시 상태 보존 후 복원, 또는 (b) 강제 default 로 통일 — 둘 중 하나 선택 명시 필요. 본 케이스는 (b) — 사용자 명시 요청 ("다시 누르면 나타나야") 이 단순함을 정당화.

### 4.27. 난방 분배기 본체 두께 두 배 (본 CL)

**요청**: "난방수 분배기 본체를 현재의 두 배 두께로 수정해주세요."

**변경**:
- size.D: 0.15 → **0.30** (15cm → 30cm)
- bbox x 범위: 7.29~7.44 → **7.14~7.44** (동측 7.44 고정 + 서측 -x 확장)
- pos.cx: 7.365 → **7.29** (새 중심)

**확장 방향 결정 (동측 고정 + 서측 확장)**: 직전 CL 에서 사용자가 "벽에서 앞 30cm 당김" 명시. 동측 (back, 벽 향) 을 고정해야 30cm 갭 (= 메인 인입관 길이) 보존. 서측 (front, 주방 향) 을 -x 로 확장해 두 배 두께 달성.

**자동 갱신**: 메인 인입관 (좌·우 회색 cylinder) 은 IIFE 의 `bbox[2]` 기반 산식 (`pipeLen = wallInnerX - bodyEastX`) 이라 동측 7.44 불변 시 자동으로 30cm 유지. 상단 밸브 / 하단 PEX 출력관은 `pos.cx` 기반이라 새 cx=7.29 로 자동 이동.

**[CC] 영향**: cabinet @FURN#52 (x=7.14~7.74, z=0.66~2.64) 와 더 깊이 겹쳐지나 `meetingOnly:true` 로 검사 skip — 평소 캐비닛에 가려지고 키 1 미팅 모드에서만 가시.

### 4.28. 베란다 외부 안전 난간 (본 CL)

**요청** (사진 첨부): "그림을 참고해 베란다 유리 바깥에 난간을 만들어주세요." 사진은 한국 아파트 표준 발코니 난간 — 100 mm 간격 세로 살, 양 끝 기둥, 상하 가로 레일.

**배치**:
- x = -0.10 (외벽 x=0 에서 10 cm 바깥, 슬라브 외측 가정)
- y = 0.05 ~ 1.10 (한국 표준 1100 mm 발코니 난간 높이)
- z = 0.96 ~ 6.54 (좌측 연속창 ① + ② 전체 길이, 5.58 m)

**구성**:
- 양 끝 기둥 (post) 50×50 mm × 2
- 상부 + 하부 가로 레일 40×40 mm 정사각
- 세로 살 18×18 mm × ~54 개, 100 mm 균등 간격 (어린이 끼임 방지 안전 규정 ≤100 mm 부합)
- 재료: 라이트 그레이 메탈 `MeshPhongMaterial(0xc0c4cc, specular:0x707080, shininess:80)`

**위치**: index.html 의 좌측 연속창 IIFE 직후. 외부 구조라 FURN bbox 미포함 → PP/미팅 모드에서도 자동 가시 (`_initPowerPlanCache` 의 hide 분류는 FURN bbox 안의 메시만 대상). 유리 (mWin opacity 0.4) 너머로 거실확장·발코니 안에서 보임.

**FURN_META 미등록**: 의도적. 사용자가 wall N 같은 badge 번호로 참조 중이라, 신규 FURN 추가 시 wall 번호 +1 시프트 회피. SHIFT-aim 라벨도 미적용 (시각 식별만).

**교훈**: 외부/구조 추가는 FURN_META 우회 가능 — 인테리어 가구가 아니면 식별자·라벨 시스템에서 제외하는 게 단순. 단 인터랙티브 hover 라벨은 포기.

### 4.29. 벽 103 거실 측 컨트롤 패널 — 인터폰·스위치·온도조절기 (본 CL)

**요청** (사진 첨부): "벽 103 왼쪽에 인터폰, 스위치, 온도조절기를 벽에 그려주세요. 이들은 1번 모드에서만 보입니다."

**벽 103 식별**: 현재 badge 기준 `WALLS[23] = [1.2, zLR2, xKit, zLR2]` = z=3.5, x=1.2~5.1 (거실/거실확장 ↔ 침실 2 경계). 거실 측 = 남면 z=3.44 (zLR2 - WT/2). "왼쪽" = 서쪽 끝, x near 1.5 (분리벽 코너).

**배치 (한국 아파트 거실 표준 위치)**:
| 부재 | 중심 (x, y, z) | 치수 (W×H×D) |
|---|---|---|
| 인터폰 (Samsung) | (1.70, 1.45, 3.42) | 30×25×4 cm |
| 스위치 (4구 로커) | (1.62, 1.10, 3.434) | 12×12×1.2 cm |
| 온도조절기 (다이얼) | (1.78, 1.10, 3.4275) | 10×12×2.5 cm |

**구성 (사진 단순화)**:
- **인터폰**: 상아색 본체 + 좌측 핸드셋 (수직 박스) + 우측 화면 (어두운 사각) + 빨간 LED + 큰 노란 비상 버튼
- **스위치**: 12×12 cm 상아색 플레이트 + 2×2 그리드 4 구 로커 스위치
- **온도조절기**: 상아색 플레이트 + 다이얼 노브 (cylinder 돌출) + 상단 어두운 vent grille

**meeting-only 패턴**: 모든 메시 `userData.meetingOnly=true` + `visible=false` 초기. `_applyMeetingExtras` (CL 51032 도입) 가 키 1 미팅 모드에서만 가시화. 평소·PP 모드 숨김. **FURN_META 미등록** — badge 시프트 회피 (사용자가 wall 번호 활발 참조 중).

**5/8 미팅 결정사항 6 카테고리 진행도 (본 CL 후)**:
1. ✅ 전원 콘센트 (CL 50995, 미팅 모드)
2. ⬜ (전원 외) 콘센트
3. ◐ 조명 위치/수량 — 스위치는 본 CL 추가, 조명 fixture 자체는 미진행
4. ✅ 난방 분배기 (CL 51028)
5. ✅ **난방 컨트롤러** (본 CL — 온도조절기)
6. ✅ 중문 디딤판 (CL 50963)
7. (보너스) 인터폰 — 본 CL

**교훈**: 벽 부착 컨트롤 패널은 외관상 furniture 가 아니라 architectural — FURN_META 우회 + meeting-only 패턴 결합으로 깔끔. 사용자가 wall N 으로 참조하는 환경에선 furniture 추가 시 시프트 영향 평가 필요.
