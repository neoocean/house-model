/* =====================================================================
   POWER PLAN MODE — 사용자 요청 (숫자 2 토글, 이전 숫자 1, CL 50975+)
   ----------------------------------------------------------------------
   본 파일은 사용자 요청 (CL 50409, S1 리팩토링) 으로 index.html 인라인 2 에서
   분리된 전원 계획 모드 로직. 토글 키는 1→2 로 변경 (CL 50975+) — 1 은
   2026-05-08 미팅 결정사항 토글용으로 예약 (구체 사항 미정).

   의존성 (globals — 모두 본 파일이 로드되기 전에 정의되어 있어야 함):
     - THREE                           (vendor/three.min.js)
     - scene                           (index.html inline 1)
     - mWall, mExt, mBath, mBal, mEntry, mCeil, mWin, mSkirting, _wpTex
                                       (index.html inline 1 머티리얼)
     - _outlets                        (outlets.js)
     - _doors                          (index.html inline 1 + furniture.js + inline 2)
     - FURN_META                       (furniture.js)
     - document.getElementById('power-plan-badge')   (index.html body)

   따라서 powerplan.js 는 inline 2 직후 (모든 _doors push 완료 후) furniture.js·
   outlets.js 다음에 로드. minimap.js (`_updateAimLabel` 의 PP 분기) 와 함께 동작.

   동작:
   - 신발장(@FURN#50) 외 모든 가구 숨김 (욕실 위생기구·붙박이장 포함). 욕실 가구
     (room==='욕실') 와 신발장은 visible 유지.
   - 모든 콘센트 plate 둘레에 노란 BoxHelper 외곽선 표시. depthTest true 유지하여
     벽 뒤 outlet 의 외곽선은 자연 가려짐.
   - 캐비닛 도어(가구 부속) 는 부모 가구와 함께 hide. 벽 도어 (방 사이/외부) 는 보존.
     판단: 도어 pivot xz 가 hide-target FURN bbox 안 (DOOR_SLACK ±5cm) 이면 캐비닛.
   - 크로스헤어가 콘센트 가리키면 라벨에 높이(cm) 추가 표시 (minimap.js _updateAimLabel).
   - SHIFT 시 추가로 벽 번호 표시 (콘센트+벽만, 그 외 무시).
   - 2 다시 누르면 이전 visible 상태로 복원.
===================================================================== */
var powerPlanMode = false;
var _ppFurnsToHide = null;     // null = 미캐싱; 첫 토글 시 분류
var _ppOutlines    = null;     // null = 미생성; 첫 토글 시 BoxHelper 생성
var _ppBadge       = null;     // lazy lookup — _getPpBadge() 사용 (스크립트 로드 시점 안전)
var _ppVisIdxsCache = null;    // visIdxs Set 캐시 (1회 빌드)
function _getPpBadge(){
  if (!_ppBadge) _ppBadge = document.getElementById('power-plan-badge');
  return _ppBadge;
}

function _initPowerPlanCache(){
  if (_ppFurnsToHide !== null) return;
  _ppFurnsToHide = [];

  // 콘센트 plate + 자식(hole) 메시는 분류 대상에서 제외 (외곽선 대상이지 숨김 대상이 아님)
  var outletSet = new Set();
  for (var oi = 0; oi < _outlets.length; oi++){
    var p = _outlets[oi].plate;
    outletSet.add(p);
    p.traverse(function(c){ outletSet.add(c); });
  }
  // 구조 재료(벽·외벽·바닥(욕실/발코니/현관)·천장·창문 유리·걸레받이) 의 메시는 PP 모드에서도
  // 절대 숨기지 않음. 머티리얼 ref 일치로 식별 — 가구 IIFE 들이 자기 머티리얼을
  // 새로 만들기 때문에 이 Set 의 ref 와 충돌 가능성 0.
  // 벽지 / 아치 스팬드럴 (mWP / mSp) 은 _wpTex 텍스처 map 으로 식별 (별도 체크).
  var structMats = new Set([mWall, mExt, mBath, mBal, mEntry, mCeil, mWin, mSkirting]);

  // 숨길 대상 bbox 목록 — 다음은 visible 유지로 제외:
  //  - @FURN#50 신발장 (사용자 요청, 현관 영역)
  //  - 욕실(room='욕실') 의 모든 가구 (변기/세면대/샤워파티션/휴지걸이/거울장/벽등 상하)
  var bboxes = [];
  Object.keys(FURN_META).forEach(function(idStr){
    var id = Number(idStr);
    var meta = FURN_META[id];
    if (id === 50) return;                            // 신발장 visible
    if (meta.room === '욕실') return;                 // 욕실 가구 전부 visible
    var fb = meta.bbox;
    bboxes.push({
      x1: fb[0], z1: fb[1], x2: fb[2], z2: fb[3],
      y1: fb.length >= 6 ? fb[4] : null,
      y2: fb.length >= 6 ? fb[5] : null
    });
  });

  // 분류 휴리스틱 상수 — 메인 traverse 와 도어 분류 모두 함수 진입부에 hoist.
  //  XZ_SLACK : bbox 외변 ±slack (자전거 hookBase 등 bbox 외 컴포넌트 포함)
  //  Y_TOL    : bbox y 위/아래 ±tol (수도꼭지·변기 탱크 상단 등 위로 튀어나온 부품)
  //  SIZE_BUF : 메시 xz 크기가 bbox + buf 이내여야 통과 (구조물 차단)
  //  DOOR_SLACK: 도어 pivot 이 bbox 안인지 검사 시 ±slack (벽 도어 vs 캐비닛 도어 분류용)
  var XZ_SLACK   = 0.20;
  var Y_TOL      = 0.50;
  var SIZE_BUF   = 0.80;
  var DOOR_SLACK = 0.05;

  // 도어 분류 — 벽 도어(방 사이/외부) 는 PP 모드에서도 보존, 캐비닛 도어(가구 부속) 는
  // 부모 가구와 함께 hide. 판단: 도어 pivot xz 가 hide-target FURN bbox 안 (DOOR_SLACK)
  // 이면 캐비닛 도어로 판정. 분류 결과는 `_doors[i].category = 'wall' | 'cabinet'` 으로
  // 메타 캐시 (S5) — 향후 재실행/검사·디버그·외부 조회에 활용.
  var doorSet = new Set();
  if (typeof _doors !== 'undefined') {
    for (var di = 0; di < _doors.length; di++){
      var pv = _doors[di].pivot;
      if (!pv) { _doors[di].category = 'wall'; continue; }
      var pvX = pv.position.x, pvZ = pv.position.z;
      var insideCabinet = false;
      for (var bi = 0; bi < bboxes.length; bi++){
        var b = bboxes[bi];
        if (pvX >= b.x1 - DOOR_SLACK && pvX <= b.x2 + DOOR_SLACK &&
            pvZ >= b.z1 - DOOR_SLACK && pvZ <= b.z2 + DOOR_SLACK){
          insideCabinet = true; break;
        }
      }
      _doors[di].category = insideCabinet ? 'cabinet' : 'wall';
      if (!insideCabinet) {
        // 벽 도어: pivot 의 모든 자손 메시를 보존 Set 에 등록
        pv.traverse(function(c){ doorSet.add(c); });
      }
    }
  }

  // 보존 검사 통합 — 새 보존 카테고리 추가 시 isPreserved 한 함수만 수정.
  //  · outletSet : 콘센트 plate + 자식 hole 메시
  //  · doorSet   : 벽 도어 (방 사이/외부) 의 모든 자손 메시
  //  · structMats: 구조 재료 (벽/외벽/욕실·발코니·현관 슬라브/천장/창 유리/걸레받이) ref 일치
  //  · _wpTex 맵 : 벽지 (mWP) / 아치 스팬드럴 (mSp) — 텍스처 ref 일치
  function isPreserved(obj){
    if (outletSet.has(obj)) return true;
    if (doorSet.has(obj)) return true;
    if (structMats.has(obj.material)) return true;
    if (obj.material && obj.material.map === _wpTex) return true;
    return false;
  }

  var aabb = new THREE.Box3();
  scene.traverse(function(obj){
    if (!obj.isMesh) return;
    if (isPreserved(obj)) return;
    aabb.setFromObject(obj);
    if (aabb.isEmpty()) return;
    var cx = (aabb.min.x + aabb.max.x) / 2;
    var cy = (aabb.min.y + aabb.max.y) / 2;
    var cz = (aabb.min.z + aabb.max.z) / 2;
    var sx = aabb.max.x - aabb.min.x;
    var sz = aabb.max.z - aabb.min.z;
    for (var i = 0; i < bboxes.length; i++){
      var b = bboxes[i];
      if (cx < b.x1 - XZ_SLACK || cx > b.x2 + XZ_SLACK) continue;
      if (cz < b.z1 - XZ_SLACK || cz > b.z2 + XZ_SLACK) continue;
      if (b.y1 !== null && (cy < b.y1 - Y_TOL || cy > b.y2 + Y_TOL)) continue;
      var fw = b.x2 - b.x1, fd = b.z2 - b.z1;
      if (sx > fw + SIZE_BUF || sz > fd + SIZE_BUF) continue;
      _ppFurnsToHide.push(obj);
      break;
    }
  });

  // [PP] 어셔션: hide 대상 메시 수가 합리적 범위인지 (대규모 변경으로 분류 누락/폭발 감지).
  // 현재 빌드 (~2026-05) 기준 _ppFurnsToHide.length ≈ 480. 큰 변경 시 ±30% 안.
  console.assert(_ppFurnsToHide.length >= 200 && _ppFurnsToHide.length <= 800,
    '[PP] _ppFurnsToHide.length=' + _ppFurnsToHide.length + ' 가 예상 범위 (200~800) 밖 — 분류 회귀 가능성');
}

function _initOutletOutlines(){
  if (_ppOutlines !== null) return;
  _ppOutlines = [];
  for (var i = 0; i < _outlets.length; i++){
    var box = new THREE.BoxHelper(_outlets[i].plate, 0xffe040);
    // depth test 기본값(true) 유지 → 벽 뒤 outlet 외곽선은 자연 가려짐.
    // transparent + opacity 만 적용해 부드러운 노란 톤 표현.
    box.material.transparent = true;
    box.material.opacity = 0.95;
    box.visible = false;
    scene.add(box);
    _ppOutlines.push(box);
  }
  // [PP] 어셔션: outline 수 = 콘센트 수 일치
  console.assert(_ppOutlines.length === _outlets.length,
    '[PP] _ppOutlines.length(' + _ppOutlines.length + ') !== _outlets.length(' + _outlets.length + ')');
}

// SHIFT-aim 시 숨겨진 가구는 라벨 표시 금지. minimap.js _getAllAimInfo 가
// FURNITURE_BBOX 인덱스를 이 Set 에 들어있는 것만 통과시킴.
// visible 유지 대상: @FURN#50 신발장 + 욕실(room='욕실') 모든 가구
//   (FURN_META id - 47 = FURNITURE/_BBOX 인덱스).
function _buildPpVisIdxs(){
  if (_ppVisIdxsCache) return _ppVisIdxsCache;
  var visIdxs = new Set();
  Object.keys(FURN_META).forEach(function(idStr){
    var id = Number(idStr);
    var meta = FURN_META[id];
    if (id === 50 || meta.room === '욕실') visIdxs.add(id - 47);
  });
  _ppVisIdxsCache = visIdxs;
  return visIdxs;
}

function setPowerPlanMode(on){
  if (on === powerPlanMode) return;
  powerPlanMode = on;
  window.powerPlanMode = on;          // minimap.js _updateAimLabel 가 참조

  if (on){
    _initPowerPlanCache();
    _initOutletOutlines();
    for (var i = 0; i < _ppFurnsToHide.length; i++){
      var m = _ppFurnsToHide[i];
      m.userData._ppPrev = m.visible;   // 이전 visible 상태 보존 (복원용)
      m.visible = false;
    }
    for (var j = 0; j < _ppOutlines.length; j++) _ppOutlines[j].visible = true;
    var badge = _getPpBadge(); if (badge) badge.style.display = 'block';
    window._ppVisibleFurnIdxs = _buildPpVisIdxs();
  } else {
    if (_ppFurnsToHide){
      for (var i = 0; i < _ppFurnsToHide.length; i++){
        var m = _ppFurnsToHide[i];
        m.visible = (m.userData._ppPrev !== undefined) ? m.userData._ppPrev : true;
      }
    }
    if (_ppOutlines){
      for (var j = 0; j < _ppOutlines.length; j++) _ppOutlines[j].visible = false;
    }
    var badge2 = _getPpBadge(); if (badge2) badge2.style.display = 'none';
    window._ppVisibleFurnIdxs = null;       // 모든 가구 SHIFT-aim 복원
  }
}

// 토글 키: 숫자 2 (Digit2). 이전 1 (Digit1) — 사용자 요청 (CL 50975+) 으로
// 1 은 2026-05-08 미팅 결정사항 토글용으로 예약 (구체 사항 미정 — 별도 핸들러 추가 시
// 본 파일과 동일 패턴으로 등록 권장).
document.addEventListener('keydown', function(e){
  if (e.code === 'Digit2'){
    e.preventDefault();
    setPowerPlanMode(!powerPlanMode);
  }
});
