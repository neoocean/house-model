# MEMORY.md — 프로젝트 기억 (사람용)

> ⚠️ **공개 GitHub repo** — 본 파일을 포함한 모든 commit 은 `https://github.com/<user>/house-model` 에 미러됩니다.
> 단지명·동·호수·주소·소유자명·시공사·거래처·금액·외부 첨부 파일명 등 **신상 식별 정보를 본 파일에 절대 추가하지 마세요**.
> 자세한 정책: [PRIVACY.md](./PRIVACY.md).
> 사적 컨텍스트(계약·견적·실측 사진 등) 는 본 repo 외부의 비공개 작업 디렉토리에 보관.

> 이 파일은 본 프로젝트와 관련해 사람이 머리에 두고 있어야 할 컨텍스트를 한 곳에 모은 단일 참고 문서다.
> 코드 동작 자체의 권위 자료는 [DESIGN.md](./DESIGN.md), 에이전트용 작업 컨텍스트는 [CLAUDE.md](./CLAUDE.md) / [AGENT.md](./AGENT.md).

---

## 1. 프로젝트 컨텍스트

### 1.1. 무엇을 만들고 있나
한 가구 거주용 아파트의 인테리어 계획을 검증하는 단일 HTML 3D 뷰어.
원본 평면도(12 000 mm × 6 600 mm, 3-bay 3-bed) 를 기반으로 일부 벽 이동·삭제·신설을 통해
거실확장·창고2 신설·복도 단축 등의 변경안을 시각화한다.

(상세 일정·계약·견적·지출 등 사적 컨텍스트는 본 repo **외부** 비공개 디렉토리에 보관 — 본 파일에 옮기지 말 것.)

### 1.2. 평면도 기본 치수
- 전체: 12 000 mm × 6 600 mm
- X 축 분할: 0 / 1500 / 5100 / 7800 / 10500 / 12000
- Z 축 분할: 0 / 2700 / 4200 / 4800 / 6600
- 천장 높이 (가정): 2 400 mm
- 벽 두께 (가정): 120 mm

### 1.3. 변경 후 레이아웃의 핵심
- **거실확장** — 침실 2 상단 벽을 z=2700 → z=3500 으로 800 mm 이동 (`zLR2 = 3.5`)
- **발코니 격벽 부분 제거** — 위쪽(z=0~3.5) 제거해 거실 ↔ 발코니 개방
- **창고 2 신설** — 좌상단 인덴트(x=0~600, z=0~900)
- **복도 단축** — 기존 z=0~6600 → z=0~4200, 우측 외벽 절반 높이
- **현관문 방향** — 외부 현관문(복도 앞면 z=0 갭) + 방화문(복도-연결통로 2 사이)
- **욕실 동쪽 chase** — 0.5 m 두꺼운 배관 박스
- **거실↔주방 배관 기둥** — x=4.9~5.3, z=0~0.75

원본 평면도의 침실 3 → 창고 + 신발장 영역으로 재구획.

### 1.4. 가구 카탈로그
표준 가구 템플릿(옷장·책장·책상·LG DIOS 가전·침대·소파·다이닝 등) 은 `furniture.js` 의 `FURN_CATALOG` 에 데이터 객체로 등록됨. 신규 가구 추가 요청 시 LLM 이 카탈로그를 참조해 표준 치수·라벨 적용.

가구 모델 번호는 일반 공개 카탈로그 값. 구매 의사·금액·구매처 같은 사적 정보는 코드/문서에 포함하지 말 것.

---

## 2. 코드 구성 (간단)

```
model/
├── index.html        ─ HTML 셸 + UI/CSS + 인라인 JS (씬·재료·바닥·벽·문·조명·카메라·컨트롤·디버그·animate, 영림 3연동 중문 IIFE 포함)
├── furniture.js      ─ FURN_REGISTRY · FURN_META (27 개) · FURN_CATALOG · 가구 IIFE 27 개
├── minimap.js        ─ 미니맵 + SHIFT-aim 라벨/치수 + hover-spread 콜아웃 + 어셔션 + 콘솔 헬퍼
├── vendor/three.min.js  ─ Three.js 0.150.1 (벤더링)
├── DESIGN.md         ─ 권위 기술 문서
├── CLAUDE.md         ─ Claude Code 자동 컨텍스트
├── AGENT.md          ─ Agent SDK 표준 컨텍스트
└── MEMORY.md         ─ 본 파일 (사람용 기억)
```

빌드 단계 없음. 브라우저로 `index.html` 을 열면 바로 동작. Three.js 는 `vendor/three.min.js` 에 동봉돼 오프라인에서도 동작.

---

## 3. 자주 쓰는 사용자 기능

| 키 | 동작 |
|---|---|
| `Space` | 프리(부감) ↔ 1인칭 모드 토글 |
| `WASD` | 이동 (프리: 수평, 1인칭: 보행) |
| `Q / E` | 프리: 위/아래 비행 / 1인칭: 눈높이 ±1 cm |
| `R` | 프리 모드에서 카메라 초기 상태 리셋 |
| **`1` / `Numpad1`** | 가구 일괄 표시/숨김 토글 (빈 공간/마감재 검토) |
| 마우스 | 프리: 좌클릭 1초 누른 후 드래그(ARM) → 시점 회전 / 1인칭: 클릭으로 Pointer Lock |
| **`SHIFT`** | 마우스 또는 크로스헤어로 조준한 객체의 식별 라벨 + 너비/길이/높이 (cm) 표시 |
| 휠 | 프리 모드 줌 |

콘솔 (F12) 명령어:
- `_inspect(48)` — @FURN#48 메타 조회
- `_gap(48, 49)` — 두 가구 사이 클리어런스 (cm)
- `_listRoom('욕실')` — 한 방의 가구 목록

URL 옵션:
- `index.html?debug` — 50 cm 그리드 + 좌표축 + 가구 BBox 외곽선 + `window._mmData` 노출
- `index.html?variant=<name>` — 레이아웃 변형 (현재는 인프라만 — 실제 변형 정의는 사용 시점에 추가)

---

## 4. 안정 식별자 (`@TYPE#NN`)

미니맵 배지의 글로벌 번호. SHIFT-aim 라벨과 `FURN_META`/`FURNITURE[]` 의 인덱스가 모두 같은 번호 사용 → 사용자가 “48 번 가구 옮겨줘” 라고 하면 LLM 이 정확히 매칭.

| 범위 | 카테고리 | 비고 |
|---|---|---|
| `@ROOM#1..15` | 방 (11) + PD/chase/기둥 (4) | 미니맵 ROOMS[] |
| `@DOOR#16..51` | 인터랙티브 도어 (36) | `_doors[]` 푸시 순서와 1:1. 회전형(swing/flap) + 미닫이(slide). |
| `@FURN#47..73` | 가구 (27) | `FURN_META[id]` (id 안정 — DOORS 변동에 따라 미니맵 배지는 시프트되나 ID 자체는 불변) |
| 벽 (43) | 미니맵 WALLS[] | 배지 번호 = 15+DOORS.length+FURN.length+i+1 = **79..121** (현재) |
| 창문 (5) | `WINDOWS_BBOX` + `WINDOWS_H/Y0` | 배지 번호 = 위 + 43 = **122..126** (현재) |

⚠️ **배지 시프트 주의**: DOORS 또는 FURNITURE 추가 시 후속 카테고리(가구/벽/창문)의 미니맵 배지 번호가 자동 시프트. 코드 anchor `@TYPE#NN` 은 작성 시점 배지를 동결한 라벨일 수 있음 — `@FURN#47` 은 FURN_META id 47 을 가리키나 현재 미니맵 배지는 "가구 52" (15 + 36 + 0 + 1). 사용자가 옛 CL 의 "벽 96" 같은 표현을 참조할 때 현 배지와 다를 수 있으므로 라벨 텍스트 (예: "신발장", "배관 기둥") 로 grep 권장.

전체 매핑은 `index.html`/`furniture.js`/`minimap.js` 의 코드 안 주석에 부착.

---

## 5. LLM 협업 방식

### 5.1. 핵심 컨벤션
- **변경은 동작 비트-동일을 전제** — 회귀가 의도된 경우만 사용자 명시.
- **인덱스 일관성** — 가구·문·창 추가/삭제는 3D 빌더 + 미니맵 배열 + (가구는) `FURN_META` 동시 수정. 어셔션이 자동 검증.
- **측정 출처 마커** — `@MEASURED YYYY-MM-DD` / `@ESTIMATE` / `@SCALED`. 실측값은 함부로 수정 금지.
- **단위** — 코드는 m. 사용자 mm/cm 표기는 `mm(1800)` / `cm(80)` 헬퍼.

### 5.2. 변경 작업 흐름
1. `p4 fstat <file>` 로 `haveRev` vs `headRev` 일치 확인 후 시작.
2. `p4 edit <file>` 로 파일 열기.
3. 코드 수정 (작은 변경 여러 개 권장).
4. DESIGN.md 동시 갱신.
5. `p4 submit -d "[항목/한줄요약] ..."` (파일 인자 없이) — default changelist 일괄 submit.
6. 브라우저 새로고침 → 콘솔에 `[M]`/`[P]`/`[U]`/`[CC]` 경고 없는지 확인. 시각 회귀는 사용자 피드백.

### 5.3. CL 디스크립션 작성 컨벤션
한국어, 4 단락 (`[배경]` / `[변경]` / `[검증]` / `[효과]`). 자세히 — 6 개월 후 본인이 다시 봐도 이해할 수 있게.

---

## 6. 과거 결정과 교훈 (요약)

자세한 항목별 기록은 [DESIGN.md §4 시행착오](./DESIGN.md) 참고.

- **데이터 / 로직 분리 점진 적용** — K(가구 데이터-중심) 는 인프라만 + 3 점 파일럿. L(재료 팔레트) 도 마찬가지. “전부 또는 전무” 보다 인프라 + 대표 사례가 안전. U/CC/W/Z/Y/AA/V/X/DD 모두 동일 패턴(인프라 + 사례) 적용 완료.
- **R 파일 분할** — index.html 4 273 → 1 943 줄. furniture.js / minimap.js / vendor/three.min.js 4 분리. LLM 한 read 윈도우 안에 들어옴.
- **시간 hysteresis (220 ms)** — SHIFT-aim 라벨이 객체 경계에서 깜빡이지 않도록.
- **어셔션 한계** — 인덱스 회귀에는 강하지만 UX/시각 회귀에는 무력. 디버그 모드 + 사용자 피드백으로 보완.
- **단일 HTML 환경** — LLM 자동 시각 검증 불가 → 사용자 피드백 사이클을 짧게 유지가 최선.

---

## 7. 적용 이력 / 후속 후보

`DESIGN.md §3.6` 참고.

**적용 완료 (인프라 + 사례)**:
- A~T (CL 49693~49720) — 코드 위생 (좌표 단일 원천, FOV 단일화, 메시 캐싱, 파일 분할 등)
- U (FURN_META 27 개), CC (충돌 검증), W (LIGHTING), Z (콘솔 헬퍼), Y (FURN_CATALOG 13 종)
- AA (BBox 6 요소화), V (ROOM_PROFILE), X (`?variant=`), DD (WALLPAPER_OVERRIDES), BB (벽 변경 체크리스트)
- 1 키 가구 일괄 토글 (CL 49803)
- 콘센트 SHIFT-aim 하이라이트 + 미러 자동화 (CL 50236 / 50244 / 50248)

**최근 변경 (CL 50270 ~ 50302)**:
- **CL 50270** — @FURN#62 주방 상부장(앞) 깊이 0.32→0.69 m: 배관 기둥(@ROOM#14) 앞면과 정렬 (사용자 요청).
- **CL 50276** — 미니맵 hover-spread 콜아웃: 마우스 호버 시 주변 36 px 안의 배지가 64+ px 원에 펼쳐짐 → 밀집 배지 식별성 향상. 정적 캐시(_staticTopCv) 에서 배지 layer 분리, 매 프레임 `drawNumberOverlay(ctx)` 동적 호출.
- **CL 50280** — @FURN#50 현관 신발장 폭 1.18→0.98 m (-20 cm): 좌측 수축, 우측 (벽 96 방향, 기둥 @ROOM#15) 부착 유지. 사용자 요청.
- **CL 50283** — @FURN#50 신발장 도어 측면 4 cm 이격 매움 (몸체 외변 flush 부착): panelW 0.44→0.48, hinge 8.94→cBaseX(8.90)/9.84→cBaseX+cW(9.88), 도어 z 위치 -1 mm 오프셋으로 측판 z-fighting 회피.
- **CL 50286** — 영림 초슬림 간살 3연동 중문 추가 (정적): 신발장 정면 우측, x=7.8 (현관-주방 경계) 의 1.5 m 개구. 알루미늄 다크 차콜 프레임 + 프로스티드 글래스 + 세로 간살 5 살/패널.
- **CL 50289** — 중문 인터랙티브 미닫이 시스템: `_doors[]` 에 `kind:'slide'` + `linkGroup:'jungmun'` 도입. 회전형(rotate) 동작 분기 보존. 클릭 시 3 패널 동기 토글, 북쪽 +z 적층. `_toggleDoorAtNDC` recursive intersect + 부모 체인 매칭. DOORS.length 33→36 으로 후속 카테고리 배지 +3 시프트.
- **CL 50296** — 중문 위치 신발장 좌측 부착: x=7.8→8.855 (xJM, 신발장 좌면 4 mm 시각 갭), z=2.7~4.2→2.76~4.14 (1.50 m→1.38 m, 침실1·창고 벽 내면 사이로 단축), panelW 0.50→0.46.
- **CL 50302** — 현관 녹색 영역(mEntry 슬라브) 을 중문 동면 (x=8.896) 까지로 단축: 동측 (방화문 측) 에서 중문까지만 녹색 보이고, 서측 (주방·식당 측) 에서 중문 base 에 녹색 안 보임. buildTileFloor 보충 + 라이저 위치 갱신.

**후속 후보** (요청 시 적용):
- 가구 27 개 K 마이그레이션 완성 (현재 3 점 파일럿 → 전체)
- 벽면 부착물(@FURN#54/56/57) BBox y 명시 (현재 4-요소 + 휴리스틱)
- 인라인 머티리얼 → PAL 추가 마이그레이션
- WALLPAPER_OVERRIDES 의 빌더 측 적용 (현재 인프라만)
- 실제 변형(`?variant=`) 정의 — 의사결정 누적되면.

요청 시 항목별 별도 CL 로 적용 — 동작 비트-동일 보존.

---

## 8. 외부 참고 자료

코드 외부 컨텍스트 자료(원본 평면도 이미지·CSV/PDF/오디오 등) 는 본 repo **외부 비공개 작업 디렉토리** 에 보관. 파일명·경로·내용 모두 본 repo (public) 에 노출하지 말 것 ([PRIVACY.md](./PRIVACY.md) 참조).

LLM/사용자가 외부 자료를 참조해 코드/문서를 수정할 때:
- 측정값·치수 등 **비식별 기술 정보** 는 본 repo 코드/주석에 반영 가능
- 인명·단지명·계약자·금액·외부 파일명 등 **식별 정보** 는 절대 반영 금지

---

## 9. 빠른 응급 처치

| 증상 | 확인 |
|---|---|
| 화면이 빈 검은색 | 콘솔에 `THREE is not defined` → `vendor/three.min.js` 로드 실패. 파일 존재 확인. |
| SHIFT 라벨이 잘못 표시 | 콘솔에 `[U]` / `[P]` 경고 → 미니맵 배열 ↔ `FURN_META` ↔ `_doors[]` 인덱스 어긋남 |
| 가구가 벽에 박힘 | 콘솔 `[CC]` 경고 → 마지막 변경 검토 |
| 미니맵 번호가 안 보임 | 페이지 로드 후 첫 1 회만 계산 — 새로고침으로 재계산 |
| 1인칭에서 외벽이 사라짐 | X-ray 효과 — 카메라가 아파트 외곽 (`x∉[xL,xR]` 또는 `z∉[zT,zB]`) 으로 나갔을 때 의도된 동작 |

---

## 10. 다음 머신/세션에서 시작할 때

1. 저장소 동기 (사용 중인 VCS 에 따라 `git pull` 또는 `p4 sync`).
2. `MEMORY.md` (본 파일) → `DESIGN.md` 순으로 정독.
3. `index.html` 열어 동작 확인 (브라우저 단독, 빌드 불필요).
4. 작업 시작.

새 머신에서 Claude Code 가 자동으로 `CLAUDE.md` 또는 `AGENT.md` 를 읽어 컨텍스트를 얻는다 — 그래도 사람은 본 `MEMORY.md` 를 먼저 보는 것을 권장.

> **공개 commit 시 체크리스트** ([PRIVACY.md](./PRIVACY.md)) — 단지명·계약자·금액·외부 파일명 추가 안 했는지 push 전 grep 으로 확인.

---

## 11. GitHub 미러 환경 (Perforce 워크스페이스 사용 시)

### 11.1. 구성
- **GitHub repo**: `https://github.com/neoocean/house-model` (public, GPL-3.0, Three.js MIT 동봉).
- **자동 미러 스크립트**: `~/bin/mirror-to-github.sh` — 매 P4 submit 직후 실행.
- **민감 키워드 파일** (저장소 외부 비공개): `~/.house-model-sensitive-keywords.txt` — push 전 audit 차단용. 한 줄에 키워드 1 개, 빈 줄·`#`-주석 허용.
- **로그 파일**: `~/.house-model-mirror.log` — 미러 실행 이력.

### 11.2. 워크플로우 (P4 ↔ GitHub)
```
변경 작업
  ↓
p4 submit -d "..."             # P4 (private) 에 commit
  ↓
~/bin/mirror-to-github.sh      # 자동 미러 (rsync + audit + commit + push)
  ↓
GitHub (public) 에 동기화 완료
```

스크립트 5 단계:
1. rsync `model/` → `~/repos/house-model/` (`.git/`, `.p4*`, `.DS_Store`, `.claude/` 제외)
2. git-only 파일 복구 (LICENSE / README.md / .gitignore / vendor/THREE_LICENSE)
3. 변경 점검 (없으면 종료)
4. 민감 키워드 audit (`~/.house-model-sensitive-keywords.txt` 패턴 매칭 시 exit 2 push 차단)
5. commit (P4 CL 번호·설명 자동 부기) + push

### 11.3. 다른 머신에서 미러 환경 셋업 시
1. GitHub repo 클론: `git clone https://github.com/neoocean/house-model.git ~/repos/house-model`
2. 인증: SSH key 등록 또는 `gh auth login`
3. 키워드 파일 작성: `~/.house-model-sensitive-keywords.txt` — [PRIVACY.md](./PRIVACY.md) §4 참조 (본 repo 에 키워드 자체 commit 금지)
4. 스크립트 복사: `~/bin/mirror-to-github.sh` (현재 머신에서 scp 또는 새로 작성)
5. 실행 권한: `chmod +x ~/bin/mirror-to-github.sh`
6. 테스트: `~/bin/mirror-to-github.sh --dry-run`

### 11.4. GitHub-only 워크플로우 (Perforce 없는 머신)
P4 미사용 환경에서는 GitHub 를 단일 ground truth 로 사용:
```bash
git clone https://github.com/neoocean/house-model.git
cd house-model
# 작업 후
git add .
git commit -m "..."
git push
```
다른 P4 워크스페이스가 변경을 가져오려면 그 머신에서 `git pull` 후 `p4 reconcile` 등으로 P4 에 흡수 (드물게 필요).
