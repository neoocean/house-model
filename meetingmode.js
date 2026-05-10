/* =====================================================================
   2026-05-08 현장 미팅 결정사항 시각화 모드 — 사용자 요청 (CL 50974 키 1 예약 → CL 50995 본 파일 신설)
   ----------------------------------------------------------------------
   숫자키 1 (Digit1) 토글. 본 모드는 5/8 미팅에서 결정된 항목들을 한
   화면에 시각화하기 위한 캔버스. 단계적으로 다음 카테고리를 추가:

     1. 전원 콘센트 위치 및 수량   ← **본 CL 에서 첫 구현** (PP 모드와 동일 효과)
     2. (전원 외) 콘센트 위치 및 수량
     3. 조명 위치 및 수량
     4. 난방 분배기 교체
     5. 난방 컨트롤러 교체
     6. 중문 발디딤틀 크기              ← 이미 모델에 반영됨 (CL 50963)

   현재 (CL 50995, 본 파일 신설 시점) 에서는 PP 모드와 시각 효과가 동일
   — 가구 hide + 콘센트 outline 표시. 추후 항목 2~5 가 추가되면 본 모드
   자체 시각화 로직 (예: 조명 마커 강조, 난방 분배기 추가) 이
   _applyOutletView 외에 합쳐짐.

   PP 모드 (powerplan.js, 키 2) 와 mutually exclusive — 한 모드 켜면
   다른 모드 자동 종료. 시각 효과는 두 모드 합집합 변화에만 토글 (배지만
   교체될 때 깜빡임 없음).

   상태 single-sourced via `window.meetingMode` — powerplan.js 가
   mutually exclusion 처리 중 `window.meetingMode = false` 로 직접
   클리어해도 본 파일 setter 와 desync 안 됨 (로컬 var 미사용).

   의존성 (모두 powerplan.js 에서 글로벌 노출):
     - _applyOutletView(on)         (시각 효과 헬퍼)
     - window.powerPlanMode          (mutual exclusion 체크용)

   따라서 meetingmode.js 는 powerplan.js **다음** 에 로드.
===================================================================== */
window.meetingMode = false;
var _meetingBadge = null;
function _getMeetingBadge(){
  if (!_meetingBadge) _meetingBadge = document.getElementById('meeting-badge');
  return _meetingBadge;
}

// 미팅-only 메시 캐시 — `userData.meetingOnly === true` 인 메시 한 번만 수집.
// 첫 _applyMeetingExtras 호출 시 lazy build. 신규 미팅-only 가구 추가 시
// (난방 컨트롤러 등) FURN_META 에 meetingOnly:true 마크 + IIFE 에서 동일 패턴
// (mesh.userData.meetingOnly = true; mesh.visible = false;) 사용 → 자동 캐싱.
var _meetingOnlyMeshes = null;
function _initMeetingOnlyCache(){
  if (_meetingOnlyMeshes !== null) return;
  _meetingOnlyMeshes = [];
  scene.traverse(function(obj){
    if (obj.isMesh && obj.userData && obj.userData.meetingOnly === true){
      _meetingOnlyMeshes.push(obj);
    }
  });
}

// 미팅 모드 전용 가시성 override. _applyOutletView 가 모든 가구를 hide 한
// 후 본 함수가 meeting-only 메시만 다시 visible 로 복원. PP 모드와 다른 점.
//   on=true:  meeting-only 메시 visible=true (override _applyOutletView 의 hide)
//   on=false: meeting-only 메시 visible=false (평소 상태로 복귀)
function _applyMeetingExtras(on){
  _initMeetingOnlyCache();
  for (var i = 0; i < _meetingOnlyMeshes.length; i++){
    _meetingOnlyMeshes[i].visible = on;
  }
}

// 미팅 모드 진입 시 UI 패널 (#ui '아파트 3D 뷰어') + 미니맵 (#minimap, #minimap-legend)
// 숨김 — 사용자 요청 ("1키 누르면 미니맵·UI 숨기기, 다시 누르면 복원").
// 모바일에서는 init 단계에서 이미 숨겨져 있으므로 본 토글 적용 안 함 (mobile 정책 보존).
function _applyMeetingUI(on){
  if (typeof IS_MOBILE !== 'undefined' && IS_MOBILE) return;
  var disp = on ? 'none' : '';
  var ui = document.getElementById('ui');
  var mc = document.getElementById('minimap');
  var ml = document.getElementById('minimap-legend');
  if (ui) ui.style.display = disp;
  if (mc) mc.style.display = disp;
  if (ml) ml.style.display = disp;
}

function setMeetingMode(on){
  if (on === !!window.meetingMode) return;
  // PP 모드와 mutually exclusive. 시각 효과 (_applyOutletView) 는 두 모드
  // 합집합 전이가 있을 때만 호출 — 배지만 교체될 때 깜빡임 회피.
  var ppActive = !!window.powerPlanMode;
  var visualWasOn = !!window.meetingMode || ppActive;
  if (on && ppActive){
    // PP → 미팅 전환: PP 플래그·배지만 정리, 시각은 유지 (meeting-only 추가는 아래).
    window.powerPlanMode = false;
    var ppBadge = document.getElementById('power-plan-badge');
    if (ppBadge) ppBadge.style.display = 'none';
  }
  window.meetingMode = on;

  if (visualWasOn !== on) _applyOutletView(on);
  // meeting-only 시각 (난방 분배기 등) — _applyOutletView 후에 호출해 hide override.
  _applyMeetingExtras(on);
  // UI 패널 + 미니맵 자동 숨김/복원 (모바일 제외).
  _applyMeetingUI(on);
  var badge = _getMeetingBadge(); if (badge) badge.style.display = on ? 'block' : 'none';
}

// 토글 키: 숫자 1 (Digit1) — 5/8 미팅 결정사항 모드.
document.addEventListener('keydown', function(e){
  if (e.code === 'Digit1'){
    e.preventDefault();
    setMeetingMode(!window.meetingMode);
  }
});
