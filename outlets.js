/* =====================================================================
   ELECTRICAL OUTLETS — 벽 콘센트 (데이터 중심 정의)
   ----------------------------------------------------------------------
   본 파일은 사용자 요청으로 index.html 에서 분리된 outlet 배치 정보 +
   빌더. layout constants (xBR, WT, zM1, zM2, zBath, zLR2) 및 helpers
   (makeLambert, scene, THREE) 는 index.html 의 inline 1 (vendor/three
   직후 첫 <script> 블록) 에서 미리 정의되어 있어야 함. 따라서 본 파일은
   inline 1 다음에 <script src="outlets.js"> 로 로드.

   OUTLETS 배열에 위치/면방향/구수를 정의하면 buildOutlet() 가 일괄
   생성. 추후 위치 조정·신규 추가·삭제는 OUTLETS 배열 한 곳만 수정.

   각 항목 형식:
     { x, y, z, face, gangs, kind?, label? }
       x, y, z: 벽 *내면* (interior surface) 좌표 (m)
                예: 남쪽 외벽 z=0 의 내면 z = WT/2 = 0.06
                    북쪽 외벽 z=6.6 의 내면 z = 6.6 - WT/2 = 6.54
                    동쪽 외벽 x=12 의 내면 x = 11.94
                    서쪽 외벽 x=0  의 내면 x = 0.06
       face: 'N' / 'S' / 'E' / 'W'  — 콘센트가 *향하는* 방향 (방 안쪽)
                  N = +z 면 (남쪽 벽에 부착, 북쪽 향함)
                  S = -z 면 (북쪽 벽에 부착, 남쪽 향함)
                  E = +x 면 (서쪽 벽에 부착, 동쪽 향함)
                  W = -x 면 (동쪽 벽에 부착, 서쪽 향함)
       gangs: 1 / 2 / 3 / 4  — 구수 (각 gang 당 폭 72 mm)
       kind:  'standard' (기본) / 'wet' (방수, 욕실용)
       label: 자유 메모 (위치 식별용)

   표준 마운트 높이 (사용자 요청, CL 50318+ → 3 단계 통일):
     낮음 (low):    0.40 m  (바닥 위 40 cm) — 거실/침실/현관/복도/창고 등
                                              일반 + 비데용 + 냉장고 뒤 등
     중간 (medium): 1.06 m  (바닥 위 106 cm) — 주방 작업대 / 세탁기·가전 /
                                                세면대 위 (방수)
     높음 (high):   1.80 m  (바닥 위 180 cm) — 주방 상부장 위 / 인덴트 상부 /
                                                욕실 거울장 안쪽 등
   각 콘센트는 가장 가까운 단계로 스냅 (이전 0.70/0.30→0.40, 1.10/1.20→1.06, 1.45→1.80).

   플레이트 치수 (가로 × 세로 mm):
     1구: 72 × 120  (가로)
     2구: 72 × 144  (세로 — 한국 표준, 사용자 요청 CL 50390)
     3구: 216 × 120 (가로)
     4구: 288 × 120 (가로)
   두께 3 mm + 클리어런스 35 mm (사용자 요청 +2cm 추가 돌출, CL 50398).

   한국식 220V Type-F 콘센트 형태 (사용자 요청):
   - 각 gang 중심에 원형 리세스 (cup, ⌀ ~46 mm) — 살짝 어두운 회색 원판
   - cup 안에 두 개의 둥근 핀 홀 (⌀ 4.4 mm, 19 mm 좌우 간격) — 가로 배치
===================================================================== */
const OUTLETS = [
  // ── 거실 (방 4) ─────────────────────────────────────────────────
  { x: 1.985, y: 0.40, z: 0.06,            face: 'N', gangs: 2, label: '거실 소파 옆 (남쪽 벽)' },
  { x: 4.50,  y: 0.40, z: 0.06,            face: 'N', gangs: 2, label: '거실 동측 (남쪽 벽)' },
  { x: 3.60,  y: 0.40, z: zLR2 - WT/2,     face: 'S', gangs: 2, label: '거실 다이닝 옆 (북쪽 벽)' },
  // ── 거실 확장 (방 1) — 인덴트 남쪽 외벽 (벽 110, x=0~0.6 z=0.9) ───
  // 사용자 요청: 두 개 중 하나 삭제 — 하부(y=0.40) 제거, 상부(y=0.70) 유지.
  { x: 0.30,  y: 0.40, z: 0.96,            face: 'N', gangs: 2, label: '거실확장 인덴트 (벽 110)' },
  // 사용자 요청: 벽 107 (창고2 남벽 좌측 x=0.6~0.7 z=0.9) 에 벽 94 같은 상하 페어 추가.
  // 거실확장 측 (face='N', z=0.9+WT/2=0.96), x 중심 0.65, 2구 세로.
  { x: 0.65,  y: 1.80, z: 0.96,            face: 'N', gangs: 2, label: '거실확장 인덴트 상부 (벽 107)' },
  { x: 0.65,  y: 0.40, z: 0.96,            face: 'N', gangs: 2, label: '거실확장 인덴트 하부 (벽 107)' },
  // 벽 102 거실 측 (face='S', z=zLR2-WT/2) 베란다 방화문(@DOOR#20, x=0.3~1.2) 옆 y=1.80
  { x: 1.35,  y: 1.80, z: zLR2 - WT/2,     face: 'S', gangs: 1, label: '거실 발코니 방화문 옆 (벽 102)' },
  // 사용자 요청: 벽 102 베란다 측(x=1.2~1.5 의 발코니 영역) 창문 아래에 2구 추가
  { x: 1.35,  y: 0.40, z: zLR2 + WT/2,     face: 'N', gangs: 2, label: '발코니 측 (벽 102 창문 아래)' },
  // ── 주방·식당 (방 5) ────────────────────────────────────────────
  // 사용자 요청: 벽 81 좌측 3개 outlet 중 가운데 작업대 좌(x=5.50, y=1.10) 삭제.
  // 좌측 상부(x=5.22, y=1.80) + 좌측 하부(x=5.22, y=0.40) 페어만 유지.
  // (이전: 5.50 작업대 좌 3구 + 5.22 좌측 상·하부 2구 페어 → 5.22 페어만 유지)
  // 사용자 요청: 벽 81 정면 우측(x=7.20) 아웃렛 '주방 작업대 우 (전자레인지)' 제거 (CL 50393).
  { x: 5.22,  y: 1.80, z: 0.06,            face: 'N', gangs: 2, label: '주방 좌측 상부 (벽 81)' },
  { x: 5.22,  y: 0.40, z: 0.06,            face: 'N', gangs: 2, label: '주방 좌측 하부 (벽 81)' },
  // 사용자 요청: 벽 94 outlet 페어를 30cm 오른쪽 (z+0.30) 으로 이동. z 2.30 → 2.60.
  { x: xBR - WT/2, y: 1.80, z: 2.60,       face: 'W', gangs: 2, label: '주방 우벽 상부 (벽 94)' },
  { x: xBR - WT/2, y: 0.40, z: 2.60,       face: 'W', gangs: 2, label: '주방 우벽 하부 (벽 94)' },
  // 사용자 요청: 냉장고 뒤 벽 106 (욕실 상단 z=4.8 의 주방 측 face='S') 추가.
  // 냉장고 @FURN#59 [6.85, 4.14, 7.75, 4.74] x 중심 7.30, 뒷면 z=4.74 (= zBath-WT/2).
  { x: 7.30,  y: 0.40, z: zBath - WT/2,    face: 'S', gangs: 1, label: '냉장고 뒤 (벽 106)' },
  // ── 서재 (방 7) ───────────────────────────────────────────────
  { x: xHall - WT/2, y: 0.40, z: 0.50,     face: 'W', gangs: 2, label: '서재 책상 좌' },
  { x: xHall - WT/2, y: 0.40, z: 2.20,     face: 'W', gangs: 2, label: '서재 남쪽' },
  // 벽 82 (서재 북쪽 외벽 x=7.8~10.5, z=0) — 사용자 재요청에 따라 좌측 단일 2구로 축소.
  // 4구(0.288 m) 는 책꽂이(@FURN#64/65, x=8.04~10.44) 와 우측 끝 좁은 갭(0.06 m) 에 안 맞음.
  // 좌측 갭 (x=7.80~8.04) 에 2구(0.144 m) 만 fit.
  { x: 7.95,  y: 1.06, z: WT/2,           face: 'N', gangs: 2, label: '서재 북측 (벽 82, 좌측)' },
  // ── 침실 2 (방 9) ───────────────────────────────────────────────
  // 침대맡 outlets — 침대 좌우(x=2.475~4.125 범위 밖) y=0.40
  { x: 2.30,  y: 0.40, z: zB - WT/2,       face: 'S', gangs: 2, label: '침실2 침대 좌측 (벽 86)' },
  { x: 4.30,  y: 0.40, z: zB - WT/2,       face: 'S', gangs: 2, label: '침실2 침대 우측 (벽 86)' },
  // 벽 102 아래(남)쪽 outlet — 사용자 요청에 따라 베란다 방화문(@DOOR#20 x=0.30~1.20) 가까이 이동.
  // 이전 x=4.80 (침실2 측 깊숙이) → x=1.55 (발코니 분리벽 동쪽 인접, 도어 가장 가까운 위치).
  { x: 1.55,  y: 0.40, z: zLR2 + WT/2,     face: 'N', gangs: 1, label: '침실2 북측 (벽 102 방화문 측)' },
  // ── 욕실 (방 10) — 방수형 ──────────────────────────────────────
  // 거울수납장(@FURN#57 xz=[5.755,6.42,6.305,6.54], y=1.30~2.20) 맨 아래칸 안쪽 (사용자 요청)
  { x: 6.03,  y: 1.80, z: zB - WT/2,       face: 'S', gangs: 2, kind: 'wet', label: '욕실 거울장 안쪽 (맨 아래칸)' },
  { x: xKit + WT/2, y: 0.40, z: 5.70,      face: 'E', gangs: 1, kind: 'wet', label: '욕실 비데용 (변기 옆)' },
  // 사용자 요청 (2026-05-08): 욕실에는 거울장 내부 + 변기 옆(비데용) 2 곳만.
  //   '휴지걸이 좌측 하부' (z=5.50) 제거됨 — 변기 (z=5.795~6.39) 보다 30cm 남쪽,
  //   "변기 옆" 위치 아닌 휴지걸이 (@FURN#56) 아래 위치였음.
  // 사용자 요청: 벽 106 욕실 측 outlet 제거됨. 주방 측(냉장고 뒤) outlet 만 유지.
  // ── 발코니 (방 3) ───────────────────────────────────────────────
  { x: 0.50,  y: 1.06, z: zB - WT/2,       face: 'S', gangs: 2, label: '발코니 세탁기' },
  // ── 연결통로 2 / 현관 (방 6) ────────────────────────────────────
  { x: 9.30,  y: 0.40, z: zM1 + WT/2,      face: 'N', gangs: 1, label: '현관' },
  // ── 복도 (방 8) ─────────────────────────────────────────────────
  { x: 11.25, y: 0.40, z: zM2 - WT/2,      face: 'N', gangs: 1, label: '복도' },
  // ── 창고 (방 11) ────────────────────────────────────────────────
  // 벽 104 (방 안에서 더 왼편으로 이동, 붙박이장2 @FURN#69 [9.24~10.44] 서쪽)
  { x: 8.95,  y: 0.40, z: zM2 + WT/2,      face: 'N', gangs: 2, label: '창고 (청소기/충전, 벽 104)' },
  // 사용자 요청: 벽 96 outlet 1m 왼쪽 이동. 창고 안에서 -x 방향 보면 left=+z 이지만
  // +z 방향(z=6) 은 붙박이장(z=5.94+) 안으로 가려짐 → -z 방향으로 이동.
  // z 5.00 → 4.30 (벽 96 시작 z=4.2 직후, 0.7m 이동 — 1m 이동 시 z=4.0 으로 wall 외부).
  { x: xBR + WT/2, y: 0.40, z: 4.30,       face: 'E', gangs: 1, label: '창고 좌벽 (벽 96, 좌측 이동)' },
  // 사용자 요청: 벽 97 (현재 badge, 창고 좌벽 = 위 outlet 과 동일 벽 [xBR, zM2~zB])
  // 중앙 (z=(4.2+6.6)/2 = 5.4) 에 2 구 콘센트 추가. face='E' 로 창고 측.
  { x: xBR + WT/2, y: 0.40, z: 5.40,       face: 'E', gangs: 2, label: '창고 좌벽 중앙 (벽 97)' },
];

// SHIFT-aim 검출용 글로벌 레지스트리 — 각 항목 {plate, spec}.
// minimap.js 의 _getAimInfo() 가 hit.object 의 부모 체인이 plate 와 일치하는지 검사.
const _outlets = [];

(function(){
  // 한국식 220 V Type-F 콘센트 (사용자 요청):
  //  - plate: 1구 72×120 mm, 2구 144×120 mm, 3구 216×120 mm, 4구 288×120 mm
  //  - 각 gang 중심에 원형 리세스 (cup, ⌀ ~46 mm) — 살짝 안쪽으로 들어간 어두운 원판
  //  - cup 안에 두 개의 둥근 핀 홀 (⌀ 4.4 mm, 19 mm 좌우 간격) — 가로 배치
  //  - 핀 홀: 어두운 회색. cup: plate 보다 살짝 어두운 회색.
  var W_PER_GANG = 0.072;
  var HEIGHT     = 0.120;
  var PLATE_T    = 0.003;
  var CLEARANCE  = 0.035;     // 벽지로부터 추가 돌출 (사용자 요청 +2cm)
  var CUP_R      = 0.023;     // 리세스 컵 반경 (지름 46 mm)
  var PIN_R      = 0.0022;    // 핀 홀 반경 (지름 4.4 mm)
  var PIN_DX     = 0.0095;    // 핀 홀 중심 ±x (좌우 간격 19 mm)
  // plate 좌표계 z 오프셋 — cup 은 plate 전면 살짝 앞, pin 은 cup 보다 더 앞.
  // (z-fighting 방지 + plate/cup/pin 의 시각 stacking 순서 명확화)
  var Z_CUP_EPS  = 0.0002;
  var Z_PIN_EPS  = 0.0004;
  var matStd  = makeLambert(0xfafafa);
  var matWet  = makeLambert(0xe8e8d8);   // 방수형: 살짝 베이지
  var matCup  = makeLambert(0xc8c8c8);   // 리세스 컵 (plate 보다 살짝 어두운 회색)
  var matPin  = makeLambert(0x1a1a1a);   // 핀 홀 어두운 회색
  var cupGeo  = new THREE.CircleGeometry(CUP_R, 28);  // 평면 원 (얇음)
  var pinGeo  = new THREE.CircleGeometry(PIN_R, 12);

  // gang 수에 따른 plate 크기 + cup 위치 계산 — 향후 새 layout (예: 5구 2x3 격자) 추가 시
  // 본 함수만 수정. buildOutlet 본문은 layout 결과만 받아 빌드.
  //   1/3/4 구: 가로 배치 (HEIGHT 120 mm 고정, W = gangs × 72 mm)
  //   2 구    : 세로 배치 (W 72 mm, H 144 mm) — 한국 표준 (사용자 요청)
  function gangLayout(gangs){
    if (gangs === 2) {
      return {
        W: W_PER_GANG,
        H: W_PER_GANG * 2,
        positions: [{gx:0, gy: +W_PER_GANG/2}, {gx:0, gy: -W_PER_GANG/2}]
      };
    }
    var W = W_PER_GANG * gangs;
    var positions = [];
    for (var g = 0; g < gangs; g++){
      positions.push({gx: -W/2 + W_PER_GANG/2 + g * W_PER_GANG, gy: 0});
    }
    return { W: W, H: HEIGHT, positions: positions };
  }

  // 면 방향 → plate 오프셋 / Y 회전 lookup table.
  //  N(+z) / S(-z) / E(+x) / W(-x) — 콘센트가 향하는 방향 = plate normal 방향.
  //  spec.x/z 는 벽 *내면* 좌표; 본 dx/dz 만큼 plate 가 실내로 돌출.
  var FACE = {
    N: { dx:  0, dz: +1, roty:  0 },
    S: { dx:  0, dz: -1, roty:  Math.PI },
    E: { dx: +1, dz:  0, roty: -Math.PI / 2 },
    W: { dx: -1, dz:  0, roty:  Math.PI / 2 }
  };

  function buildOutlet(o){
    var L = gangLayout(o.gangs);
    var mat = (o.kind === 'wet') ? matWet : matStd;
    var off = CLEARANCE + PLATE_T / 2;
    var f = FACE[o.face];
    var px = o.x + f.dx * off;
    var pz = o.z + f.dz * off;
    var py = o.y;
    var plate = new THREE.Mesh(new THREE.BoxGeometry(L.W, L.H, PLATE_T), mat);
    plate.position.set(px, py, pz);
    plate.rotation.y = f.roty;
    plate.castShadow = false;
    plate.receiveShadow = true;
    scene.add(plate);
    // gang 마다 한국식 원형 리세스 + 핀 홀 2개 (각 gang 의 cup 안 가로 배치)
    for (var gi = 0; gi < L.positions.length; gi++){
      var gp = L.positions[gi];
      // 리세스 컵 — plate 전면 살짝 앞 (Z_CUP_EPS, plate 좌표계 상)
      var cup = new THREE.Mesh(cupGeo, matCup);
      cup.position.set(gp.gx, gp.gy, PLATE_T/2 + Z_CUP_EPS);
      plate.add(cup);
      // 두 핀 홀 — cup 위 더 앞 (Z_PIN_EPS) 에 가로로 배치 (한국 Type-F 핀은 가로 한 쌍)
      for (var h = 0; h < 2; h++){
        var hx = -PIN_DX + h * (PIN_DX * 2);  // -0.0095 / +0.0095
        var pin = new THREE.Mesh(pinGeo, matPin);
        pin.position.set(gp.gx + hx, gp.gy, PLATE_T/2 + Z_PIN_EPS);
        plate.add(pin);
      }
    }
    _outlets.push({ plate: plate, spec: o });    // SHIFT-aim 검출/하이라이트 용
  }
  OUTLETS.forEach(buildOutlet);

  // [O] OUTLETS 데이터 검증 — init time 1회. 좌표·face·gangs 가 합리적 범위인지 검사.
  //   잘못된 face / 비정상 gangs / 아파트 외부 좌표 / 음수 y 등을 [O] 어셔션으로 보고.
  //   동작 변경 0, 비용 무시 가능 (26 항목).
  var APT = { x:[0, 12], y:[0, 2.4], z:[0, 6.6] };       // 아파트 평면 + CH
  var VALID_FACES = { N:1, S:1, E:1, W:1 };
  OUTLETS.forEach(function(o, i){
    var lbl = '[' + i + ' ' + (o.label || '?') + ']';
    console.assert(VALID_FACES[o.face],
      '[O] ' + lbl + ' face=' + JSON.stringify(o.face) + ' 가 N/S/E/W 가 아님');
    console.assert(typeof o.gangs === 'number' && o.gangs >= 1 && o.gangs <= 4,
      '[O] ' + lbl + ' gangs=' + o.gangs + ' 가 범위[1,4] 밖');
    console.assert(o.x >= APT.x[0] - 0.05 && o.x <= APT.x[1] + 0.05,
      '[O] ' + lbl + ' x=' + o.x + ' 가 아파트 x 범위[0,12] 밖');
    console.assert(o.y >= 0 && o.y <= APT.y[1] + 0.05,
      '[O] ' + lbl + ' y=' + o.y + ' 가 아파트 y 범위[0,CH] 밖');
    console.assert(o.z >= APT.z[0] - 0.05 && o.z <= APT.z[1] + 0.05,
      '[O] ' + lbl + ' z=' + o.z + ' 가 아파트 z 범위[0,6.6] 밖');
    console.assert(!o.kind || o.kind === 'wet' || o.kind === 'standard',
      '[O] ' + lbl + ' kind=' + JSON.stringify(o.kind) + ' 가 wet/standard/undefined 가 아님');
  });
})();

// 콘솔 헬퍼 — `_outletStats()` 로 OUTLETS 통계 출력. POWERPLAN.md 의 수치와 동기 검증용.
//   {total, totalGangs, byRoom, byKind} 반환. 라벨 첫 단어를 방 키로 추출.
window._outletStats = function(){
  var stats = { total: OUTLETS.length, totalGangs: 0, byRoom: {}, byKind: { standard:0, wet:0 } };
  OUTLETS.forEach(function(o){
    stats.totalGangs += o.gangs;
    var roomKey = (o.label || '?').split(/[ (]/)[0];
    stats.byRoom[roomKey] = (stats.byRoom[roomKey] || 0) + 1;
    stats.byKind[o.kind === 'wet' ? 'wet' : 'standard']++;
  });
  return stats;
};
