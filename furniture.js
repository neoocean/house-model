/* =====================================================================
   FURNITURE  — 가구

   [데이터 중심 변환 — 항목 K]
   각 가구는 가급적 spec 객체 + 빌더 함수 형태로 정의:
     defineFurniture({ id, name, room, pos, size, bbox, ... }, function(spec){
       // spec.pos.cx, spec.size.W 등을 사용해 메시 생성
     });
   FURN_REGISTRY 에 spec 가 자동 등록 → 추후 미니맵 FURNITURE[]/
   FURNITURE_BBOX[] 의 단일 원천화에 활용. 미변환 IIFE 는 점진 마이그레이션.
===================================================================== */
const FURN_REGISTRY = [];
function defineFurniture(spec, build) {
  FURN_REGISTRY.push(spec);
  build(spec);
}

/* =====================================================================
   FURN_META — 가구 메타데이터 단일 카탈로그 (항목 U)
   ----------------------------------------------------------------------
   28 개 가구 모두에 대한 {id, name, room, pos, size, bbox, source} 정보.
   K 마이그레이션 여부와 무관하게 LLM·콘솔이 단일 객체에서 전체 가구를 조회 가능.

   사용 예:
     FURN_META[48].size.W                                       // 침실2 침대 너비
     Object.values(FURN_META).filter(m => m.room === '욕실')    // 욕실 가구 목록
     window._inspect(48)                                        // (Z 항목 헬퍼)

   키: 글로벌 @FURN# 번호 (47..73). 미니맵 FURNITURE[] 인덱스 = id - 47.
   size.W / size.D 는 bbox 의 xz 범위와 일치, size.H 는 bbox 6-요소(yMin, yMax)
   에서 추출하거나 K 마이그레이션 spec / 코드 inspection 으로 채움.
===================================================================== */
const FURN_META = {
  47: { id:47, name:'드럼세탁기',         room:'발코니',     pos:{cx:0.50,  cz:6.09 }, size:{W:0.90, D:0.90, H:1.275}, bbox:[0.05,  5.64,  0.95,  6.54],            source:'@ESTIMATE 실제 치수 ×1.5' },
  48: { id:48, name:'침실2 침대',         room:'침실 2',     pos:{cx:3.30,  cz:5.52 }, size:{W:1.65, D:2.05, H:0.60 }, bbox:[2.475, 4.49,  4.125, 6.54],            source:'@ESTIMATE 퀸 사이즈, 헤드보드 0.55' },
  49: { id:49, name:'침실1 책상',         room:'침실 1',     pos:{cx:10.04, cz:1.35 }, size:{W:0.80, D:1.80, H:0.74 }, bbox:[9.64,  0.45,  10.44, 2.25],            source:'@ESTIMATE 표준 책상' },
  50: { id:50, name:'현관 신발장',        room:'연결통로 2', pos:{cx:9.57,  cz:3.77 }, size:{W:1.18, D:0.37, H:2.40 }, bbox:[8.7,   3.77,  9.88,  4.14],            source:'@ESTIMATE 천장까지' },
  51: { id:51, name:'주방 하부장(앞)',    room:'주방·식당',  pos:{cx:6.54,  cz:0.36 }, size:{W:2.40, D:0.60, H:1.00 }, bbox:[5.34,  0.06,  7.74,  0.66, 0,    1.0 ] },
  52: { id:52, name:'주방 하부장(우)',    room:'주방·식당',  pos:{cx:7.44,  cz:1.65 }, size:{W:0.60, D:1.98, H:1.00 }, bbox:[7.14,  0.66,  7.74,  2.64, 0,    1.0 ] },
  53: { id:53, name:'욕실 변기',          room:'욕실',       pos:{cx:5.55,  cz:5.97 }, size:{W:0.38, D:0.595,H:0.78 }, bbox:[5.36,  5.795, 5.74,  6.39, 0,    0.78] },
  54: { id:54, name:'욕실 세면대',        room:'욕실',       pos:{cx:6.03,  cz:6.20 }, size:{W:0.50, D:0.38, H:0.85 }, bbox:[5.78,  6.01,  6.28,  6.39],            source:'@ESTIMATE basin top 0.85m' },
  55: { id:55, name:'샤워 파티션',        room:'욕실',       pos:{cx:6.55,  cz:6.00 }, size:{W:0.12, D:1.10, H:2.00 }, bbox:[6.49,  5.45,  6.61,  6.55],            source:'@ESTIMATE 솔리드+유리' },
  56: { id:56, name:'욕실 휴지걸이',      room:'욕실',       pos:{cx:5.15,  cz:5.90 }, size:{W:0.074,D:0.16, H:0.16 }, bbox:[5.086, 5.82,  5.16,  5.98] },
  57: { id:57, name:'욕실 거울장',        room:'욕실',       pos:{cx:6.03,  cz:6.48 }, size:{W:0.55, D:0.12, H:0.90 }, bbox:[5.755, 6.42,  6.305, 6.54],            source:'@ESTIMATE 1.30~2.20m' },
  58: { id:58, name:'수납장',             room:'주방·식당',  pos:{cx:6.55,  cz:4.44 }, size:{W:0.60, D:0.60, H:2.40 }, bbox:[6.25,  4.14,  6.85,  4.74],            source:'@ESTIMATE 키친핏 전고' },
  59: { id:59, name:'냉장고',             room:'주방·식당',  pos:{cx:7.30,  cz:4.44 }, size:{W:0.90, D:0.60, H:2.40 }, bbox:[6.85,  4.14,  7.75,  4.74],            source:'@ESTIMATE 키친핏 전고' },
  60: { id:60, name:'욕실 벽등(상)',      room:'욕실',       pos:{cx:5.545, cz:6.50 }, size:{W:0.29, D:0.15, H:0.31 }, bbox:[5.40,  6.40,  5.69,  6.55, 1.96, 2.27] },
  61: { id:61, name:'욕실 벽등(하)',      room:'욕실',       pos:{cx:5.545, cz:6.50 }, size:{W:0.29, D:0.15, H:0.26 }, bbox:[5.40,  6.40,  5.69,  6.55, 1.69, 1.95] },
  62: { id:62, name:'주방 상부장(앞)',    room:'주방·식당',  pos:{cx:6.54,  cz:0.22 }, size:{W:2.40, D:0.32, H:0.90 }, bbox:[5.34,  0.06,  7.74,  0.38, 1.5,  2.4 ] },
  63: { id:63, name:'실내 자전거',        room:'거실확장',   pos:{cx:0.55,  cz:1.80 }, size:{W:0.70, D:1.50, H:1.60 }, bbox:[0.20,  1.05,  0.90,  2.55, 0,    1.60], source:'@ESTIMATE Tacx Neo Bike Smart 스타일' },
  64: { id:64, name:'침실1 책꽂이 1',       room:'침실 1',     pos:{cx:9.84,  cz:0.185}, size:{W:1.20, D:0.25, H:1.85 }, bbox:[9.24,  0.06,  10.44, 0.31, 0,    1.85] },
  65: { id:65, name:'침실1 책꽂이 2',       room:'침실 1',     pos:{cx:8.64,  cz:0.185}, size:{W:1.20, D:0.25, H:1.85 }, bbox:[8.04,  0.06,  9.24,  0.31, 0,    1.85] },
  66: { id:66, name:'침실1 책꽂이 3',       room:'침실 1',     pos:{cx:9.64,  cz:2.515}, size:{W:1.60, D:0.25, H:1.85 }, bbox:[8.84,  2.39,  10.44, 2.64, 0,    1.85] },
  67: { id:67, name:'벽걸이 로드 자전거',   room:'침실 1',     pos:{cx:8.06,  cz:1.40 }, size:{W:0.18, D:1.70, H:0.95 }, bbox:[8.00,  0.50,  8.18,  2.20, 0.55, 1.50], source:'@ESTIMATE S-Works 스타일' },
  68: { id:68, name:'창고 붙박이장',        room:'창고',       pos:{cx:9.08,  cz:6.24 }, size:{W:2.40, D:0.60, H:2.40 }, bbox:[7.88,  5.94,  10.28, 6.54, 0,    2.40] },
  69: { id:69, name:'창고 붙박이장 2',      room:'창고',       pos:{cx:9.84,  cz:4.56 }, size:{W:1.20, D:0.60, H:2.40 }, bbox:[9.24,  4.26,  10.44, 4.86, 0,    2.40] },
  70: { id:70, name:'거실 소파',            room:'거실',       pos:{cx:1.985, cz:1.16 }, size:{W:0.85, D:2.20, H:0.95 }, bbox:[1.56,  0.06,  2.41,  2.26, 0,    0.95] },
  71: { id:71, name:'거실 다이닝 테이블',   room:'거실',       pos:{cx:3.60,  cz:0.76 }, size:{W:1.60, D:0.80, H:0.73 }, bbox:[2.80,  0.36,  4.40,  1.16, 0,    0.73] },
  72: { id:72, name:'거실 벤치',            room:'거실',       pos:{cx:3.60,  cz:0.21 }, size:{W:1.40, D:0.30, H:0.42 }, bbox:[2.90,  0.06,  4.30,  0.36, 0,    0.42] },
  73: { id:73, name:'주방 플랩 상부장(우)', room:'주방·식당',  pos:{cx:7.59,  cz:1.65 }, size:{W:0.30, D:1.20, H:0.60 }, bbox:[7.44,  1.05,  7.74,  2.25, 1.50, 2.10], source:'@USER 벽 90 상단 2단 플랩 도어 (반투명, 축소판, 천장에서 30cm 띄움)' },
};

/* =====================================================================
   FURN_CATALOG — 일반 가구 템플릿 카탈로그 (항목 Y)
   ----------------------------------------------------------------------
   상위 디렉토리 '인테리어 예산 및 집행 - 가구 후보.csv' 의 후보 가구 +
   자주 추가될 표준 가구의 치수·모델·라벨 데이터. 신규 가구 추가 시
   "@FURN# 추가: 제크리 옷장 1200" 같은 요청을 받으면 LLM 이 이
   카탈로그를 참조해 표준 치수·라벨을 정확히 적용 가능.

   사용 예 (콘솔):
     FURN_CATALOG.closet_zekri_1200            // 제크리 옷장 메타
     Object.values(FURN_CATALOG).filter(c => c.kind === 'closet')

   현재는 데이터 테이블만 — 실제 메시 빌더는 별도 IIFE 작성 필요.
   향후 placeFurniture(catalogKey, room, x, z, opts) 헬퍼 추가 가능.

   치수 단위: m. CSV 의 mm 표기는 / 1000 으로 변환.
===================================================================== */
const FURN_CATALOG = {
  // ── 옷장 / 붙박이장 ─────────────────────────────────────────────
  closet_zekri_1200:    { kind:'closet',  W:1.20, D:0.60, H:2.10,
                          label:'제크리 슬라이딩 옷장 1200×3',
                          source:'@CSV 가구 후보 / 네이버' },
  closet_iaanbig_1200:  { kind:'closet',  W:1.20, D:0.60, H:2.10,
                          label:'이안빅 슬라이딩 옷장 1200×3',
                          source:'@CSV 가구 후보 / 오늘의집' },
  closet_bloom_1200:    { kind:'closet',  W:1.20, D:0.60, H:2.10,
                          label:'블룸 철제 드레스룸 1200×3',
                          source:'@CSV 가구 후보 / 동서가구' },
  // ── 책장 / 책상 ─────────────────────────────────────────────────
  bookshelf_desker_w800: { kind:'shelf',  W:0.80, D:0.32, H:1.80,
                           label:'데스커 W800 철제 책장',
                           source:'@CSV 가구 후보 / 데스커' },
  desk_desker_2_0:       { kind:'desk',   W:1.80, D:0.80, H:0.74,
                           label:'데스커 컴퓨터데스크 2.0 (1800×800)',
                           source:'@CSV 가구 후보 / 데스커' },
  // ── LG DIOS 가전 ────────────────────────────────────────────────
  fridge_lg_dios_m616:    { kind:'fridge',  W:0.914, D:0.698, H:1.85,
                            model:'M616MQQ0M1', color:'에센스화이트',
                            label:'LG DIOS 냉장고 M616MQQ0M1',
                            source:'@CSV 가구 후보 / LG' },
  dishwasher_lg_dios_dee6:{ kind:'dishwasher', W:0.598, D:0.595, H:0.847,
                            model:'DEE6**E',
                            label:'LG DIOS 식기세척기 DEE6**E',
                            source:'@CSV 가구 후보 / LG' },
  induction_lg_dios_bei3: { kind:'induction', W:0.760, D:0.520, H:0.078,
                            model:'BEI3QKHLOE',
                            label:'LG DIOS 인덕션 BEI3QKHLOE',
                            source:'@CSV 가구 후보 / LG' },
  microwave_lg_mw23gd:    { kind:'microwave', W:0.476, D:0.388, H:0.275,
                            model:'MW23GD', color:'화이트',
                            label:'LG 전자레인지 MW23GD',
                            source:'@CSV 가구 후보 / LG' },
  // ── 표준 가구 (참고용) ───────────────────────────────────────────
  bed_queen:            { kind:'bed',    W:1.50, D:2.00, H:0.50,
                          label:'퀸 사이즈 침대 (표준)' },
  bed_king:             { kind:'bed',    W:1.80, D:2.00, H:0.50,
                          label:'킹 사이즈 침대 (표준)' },
  sofa_2seater:         { kind:'sofa',   W:0.85, D:1.80, H:0.85,
                          label:'2-seater 소파 (표준)' },
  dining_4person:       { kind:'table',  W:1.40, D:0.80, H:0.74,
                          label:'4인용 다이닝 테이블 (표준)' },
};

// @FURN#47 드럼세탁기
// ── 드럼세탁기 (발코니 아래쪽 벽에 부착, 회색 육면체) ──
// 위치: 발코니 좌측(외벽 x=0 근처), 아래쪽 외벽(z=6.6) 내면에 밀착
//       PD(우하단 x=1.1~1.5)와 충돌 방지 위해 x 중심 0.75 → 0.5로 이동
defineFurniture({
  id: 47, name: '드럼세탁기', room: '발코니',
  pos:  { cx: 0.5, cz: 6.6 - WT/2 - 0.45 },        // z ≈ 6.09 (외벽 내면 ~ 깊이 절반)
  size: { W: 0.9, D: 0.9, H: 1.275 },               // @ESTIMATE 실제 치수 × 1.5
  bbox: [0.05, 5.64, 0.95, 6.54],
  notes: 'PD(x=1.1~1.5)와 0.15m 클리어런스 위해 x 중심 0.75→0.5',
}, function(spec){
  var W = spec.size.W, D = spec.size.D, H = spec.size.H;
  var cx = spec.pos.cx, cz = spec.pos.cz;
  var mat = makeLambert(PAL.metal.appliance);   // PAL.metal.appliance (드럼세탁기 외관)
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mat);
  mesh.position.set(cx, FT + H/2, cz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // 세탁기 도어 원형 (앞면 중앙, 어두운 회색) — 반지름도 1.5배
  var doorGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.02, 32);
  var doorMat = makeLambert(PAL.metal.matte);   // PAL.metal.matte (세탁기 도어)
  var door = new THREE.Mesh(doorGeo, doorMat);
  door.rotation.x = Math.PI / 2;
  door.position.set(cx, FT + H/2, 6.6 - WT/2 - D + 0.01);
  scene.add(door);
});

// @FURN#70 거실 소파
// ── 거실 모듈식 소파 (2-seater, 방 5 향함, 양쪽 팔걸이) ─────────────
// 위치: 거실(방 4, x=1.5~5.1, z=0~3.5)
// - 한쪽 팔걸이(북측)가 벽 73(z=0) 내면에 부착
// - 긴 축은 z 방향 (남북), 짧은 축은 x 방향 (동서)
// - 시트 정면이 +x(동) 방향 = 방 5(주방·식당) 향함
// - 시트 모듈 2개 + 양쪽 팔걸이, 베이지 크림 톤
(function(){
  var sLen = 2.20;                            // z 방향 길이
  var sDep = 0.85;                            // x 방향 깊이 (등받이~시트 앞)
  var sZ1  = WT/2;                             // 0.06 (벽 73 내면, 북측 끝)
  var sZ2  = sZ1 + sLen;                      // 2.26 (남측 끝)
  var sCZ  = (sZ1 + sZ2) / 2;                 // 1.16

  var sBackX  = xBal + WT/2;                   // 1.56 (벽 103 동측 내면 부착)
  var sFrontX = sBackX + sDep;                 // 2.41 (정면)
  var sCX     = (sBackX + sFrontX) / 2;        // 1.985

  /* 재질 — 베이지 크림 패브릭 + 어두운 플린스 */
  var mSeat   = new THREE.MeshLambertMaterial({color:0xe6dcc6});
  var mPlinth = new THREE.MeshLambertMaterial({color:0x303030});

  /* 1) 플린스 */
  var plinthH = 0.04;
  B(sDep - 0.05, plinthH, sLen - 0.04, mPlinth, sCX, FT + plinthH/2, sCZ);

  /* 치수 — 양쪽 팔걸이 0.25m + 시트 2개 0.85m × 2 = 2.20m */
  var armW   = 0.25;                           // 팔걸이 z 방향 폭
  var nSeats = 2;
  var seatW  = (sLen - 2 * armW) / nSeats;    // 0.85 (각 시트 z 방향 폭)
  var seatModH = 0.32;
  var seatModY = FT + plinthH + seatModH/2;
  var backRollH   = 0.34;
  var backRollDep = 0.45;
  var backRollY   = FT + plinthH + seatModH + backRollH/2 - 0.04;

  /* 2) 북측(좌측) 팔걸이 — 벽 73에 부착 */
  var armH  = seatModH + backRollH - 0.06;     // 0.60
  var armY  = FT + plinthH + armH/2;
  var armNCZ = sZ1 + armW/2;                   // 0.185
  B(sDep, armH, armW * 0.97, mSeat, sCX, armY, armNCZ);

  /* 3) 시트 모듈 2개 + 등받이 베개 2개 (북측 팔걸이 ~ 남측 팔걸이 사이) */
  var seatStartZ = sZ1 + armW;                  // 0.31 (북측 팔걸이 다음)
  for (var i = 0; i < nSeats; i++){
    var modCZ = seatStartZ + seatW * (i + 0.5);
    // 시트 본체
    B(sDep, seatModH, seatW * 0.97, mSeat, sCX, seatModY, modCZ);
    // 등받이 베개
    B(backRollDep, backRollH, seatW * 0.97, mSeat,
      sBackX + backRollDep/2, backRollY, modCZ);
  }

  /* 4) 남측(우측) 팔걸이 */
  var armSCZ = sZ2 - armW/2;                    // 2.135
  B(sDep, armH, armW * 0.97, mSeat, sCX, armY, armSCZ);
})();

// @FURN#71 거실 다이닝 테이블, @FURN#72 거실 벤치
// ── 거실 다이닝 테이블 + 벤치 (사진 참고: 오크 패널레그 슬랩 트레슬) ─────
// 위치: 거실(방 4) 동남쪽 영역, 소파(가구 72) 동측 + 남측 공간
// 형태: 솔리드 우드 상판 + 양 끝 패널 다리, 매칭 벤치 1개 (북측면)
(function(){
  /* === 테이블 === */
  var tW    = 1.60;                            // x 방향 길이
  var tD    = 0.80;                            // z 방향 깊이
  var tH    = 0.73;                            // 전체 높이
  var topT  = 0.040;                           // 상판 두께
  var legT  = 0.040;                           // 다리 패널 x 방향 두께
  var legInsetX = 0.05;                        // 다리 패널 x 인셋
  var legInsetZ = 0.04;                        // 다리 패널 z 인셋
  var tCX = 3.60;                              // x 중심
  var tCZ = 0.76;                              // z 중심 (벤치 z=0.06~0.36 + 테이블 z=0.36~1.16)
  // 벤치(0.30m)가 벽 76 내면(z=0.06)에 부착, 테이블이 벤치 남측에 인접
  var tX1 = tCX - tW/2;                        // 2.80
  var tX2 = tCX + tW/2;                        // 4.40
  var topY = FT + tH - topT/2;                 // 상판 y 중심
  var legY = FT + (tH - topT)/2;               // 다리 y 중심
  var legH = tH - topT;                        // 다리 높이

  /* 재질 — 오크 우드톤 (밝은 + 어두운 강조) */
  var mWood   = new THREE.MeshPhongMaterial({color:0xb38f5e, specular:0x4a3a26, shininess:35});
  var mWoodDk = new THREE.MeshPhongMaterial({color:0x8a6c40, specular:0x3a2a1a, shininess:30});

  /* 1) 테이블 상판 */
  B(tW, topT, tD, mWood, tCX, topY, tCZ);

  /* 2) 양 끝 패널 다리 (x 양 끝, z 인셋, 트레슬 형태) */
  var legD = tD - legInsetZ*2;                 // 다리 z 깊이
  // 좌측 다리 (x=tX1 측)
  B(legT, legH, legD, mWoodDk, tX1 + legInsetX + legT/2, legY, tCZ);
  // 우측 다리 (x=tX2 측)
  B(legT, legH, legD, mWoodDk, tX2 - legInsetX - legT/2, legY, tCZ);

  /* === 벤치 (테이블 북측면, 매칭 우드) === */
  var bW = 1.40;                               // x 방향 길이
  var bD = 0.30;                               // z 방향 깊이
  var bH = 0.42;                               // 높이
  var bTopT = 0.030;
  var bLegT = 0.030;
  var bLegInset = 0.04;
  var bCX = tCX;                               // 테이블과 동일 x 중심
  var bZ2 = tCZ - tD/2;                        // 2.50 (벤치 남측 끝, 테이블 북측 끝과 인접)
  var bZ1 = bZ2 - bD;                          // 2.20 (벤치 북측 끝)
  var bCZ = (bZ1 + bZ2)/2;                     // 2.35
  var bX1 = bCX - bW/2;                        // 2.90
  var bX2 = bCX + bW/2;                        // 4.30
  var bTopY = FT + bH - bTopT/2;
  var bLegY = FT + (bH - bTopT)/2;
  var bLegH = bH - bTopT;
  var bLegD = bD - bLegInset*2;

  /* 1) 벤치 상판 */
  B(bW, bTopT, bD, mWood, bCX, bTopY, bCZ);

  /* 2) 벤치 양 끝 패널 다리 */
  B(bLegT, bLegH, bLegD, mWoodDk, bX1 + bLegInset + bLegT/2, bLegY, bCZ);
  B(bLegT, bLegH, bLegD, mWoodDk, bX2 - bLegInset - bLegT/2, bLegY, bCZ);
})();

// @FURN#63 실내 자전거
// ── 거실확장 실내 자전거 (Tacx Neo Bike Smart 스타일, 디테일 강화) ──
// 위치: 벽 78 (z=0.9, x=0~0.6) 과 창문 88 (x=0, z=0.96~3.44)이 만나는
//       거실확장(방 1) NW 코너 근처. 핸들바가 -z(코너) 향함.
// 디테일: 조각된 사이드 패널(ExtrudeGeometry), 트라이포드 뒷다리,
//        조절 레일(안장·핸들바), 시프터 후드+청록 액센트, 코일 케이블,
//        흰색 플라이휠 + 볼트, 단일 쿨링 팬, 벤트 그릴, LED 인디케이터.
(function(){
  var bcx = 0.55;            // 바이크 중심 x
  var bcz = 1.80;            // 바이크 중심 z
  var bL  = 1.30;            // z 방향 전체 길이
  var zF  = bcz - bL/2;       // 1.15  (front)
  var zB  = bcz + bL/2;       // 2.45  (back)

  // 재질 — 매트 차콜/그레이 톤 (디테일 가시성 위해 한 단계 더 밝게) ────
  var mFrame  = new THREE.MeshPhongMaterial({
    color:0x6e6e78, specular:0x80808a, shininess:75,
    emissive:0x14141a, side:THREE.DoubleSide
  });
  var mFrameL = new THREE.MeshPhongMaterial({color:0x84848e, specular:0x90909a, shininess:80, emissive:0x16161c});
  var mLeg    = new THREE.MeshLambertMaterial({color:0x68686e, emissive:0x12121a});
  var mSeat   = new THREE.MeshPhongMaterial({color:0x52525a, specular:0x6a6a72, shininess:50, emissive:0x101016});
  var mRail   = new THREE.MeshLambertMaterial({color:0x9a9aa4, emissive:0x1a1a22});  // 알루미늄 레일
  var mWheel  = new THREE.MeshPhongMaterial({color:0xf2f2f2, specular:0x909090, shininess:90});
  var mHub    = new THREE.MeshPhongMaterial({color:0x70707a, specular:0x90909a, shininess:100, emissive:0x14141a});
  var mBolt   = new THREE.MeshPhongMaterial({color:0xb6b6be, specular:0xc0c0c8, shininess:140});
  var mTape   = new THREE.MeshLambertMaterial({color:0x5a5a62, emissive:0x141418});  // 핸들바 테이프
  var mScreen = new THREE.MeshLambertMaterial({color:0x3c3c50, emissive:0x18182a});  // 청회색 화면
  var mFan    = new THREE.MeshPhongMaterial({color:0x6c6c74, specular:0x808088, shininess:65, emissive:0x14141a});
  var mFanBl  = new THREE.MeshLambertMaterial({color:0x52525a, emissive:0x10101a});
  var mBottle = new THREE.MeshPhongMaterial({color:0x7a7a86, specular:0x88889a, shininess:75, emissive:0x16161c});
  var mMat    = new THREE.MeshLambertMaterial({color:0x56565a, emissive:0x121214});  // 매트 (밝은 회색)
  var mAccent = new THREE.MeshBasicMaterial({color:0x2dc6db});  // Tacx 청록 액센트
  var mLED    = new THREE.MeshBasicMaterial({color:0x6cff8c});  // 녹색 LED 인디케이터
  var mLogo   = new THREE.MeshLambertMaterial({color:0x7a7a80, emissive:0x14141a});

  // ① 바닥 매트 ────────────────────────────────────────────────────
  B(0.85, 0.005, 1.55, mMat, bcx, FT + 0.003, bcz);

  // ② 앞 받침다리 — 와이드 ski 형태 + Tacx 로고 액센트 ─────────────
  B(0.50, 0.06,  0.30, mLeg,    bcx, FT + 0.030,  zF + 0.05);   // 메인 발
  B(0.36, 0.045, 0.10, mLeg,    bcx, FT + 0.0225, zF - 0.05);   // toe (가늘어짐)
  B(0.42, 0.005, 0.012, mAccent, bcx, FT + 0.063, zF - 0.04);   // Tacx 청록 액센트
  B(0.10, 0.020, 0.055, mLogo,   bcx, FT + 0.045, zF - 0.04);   // 로고 영역

  // ③ 뒤 받침다리 — 트라이포드 (좌우로 벌어지는 두 다리) ──────────
  function rearLeg(side){
    var rx = bcx + side * 0.18;
    var rz = zB - 0.10;
    var leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.06, 0.40),
      mLeg
    );
    leg.position.set(rx, FT + 0.030, rz);
    leg.rotation.y = side * 0.22;     // 약 12.6° 바깥쪽 벌림
    leg.castShadow = true;
    scene.add(leg);
  }
  rearLeg(-1);
  rearLeg(+1);
  // 뒷다리 베이스 연결 (두 다리 안쪽 연결 박스)
  B(0.16, 0.05, 0.10, mLeg, bcx, FT + 0.025, zB - 0.10);

  // ④ 사이드 패널 (좌우, ExtrudeGeometry로 조각) ──────────────────
  // 외형: 앞 컬럼 + 어깨 슬로프 + belly hourglass + 안장 컬럼
  function sideProfile(){
    var s = new THREE.Shape();
    s.moveTo(zF + 0.07, FT + 0.10);            // front-bottom
    s.lineTo(zF + 0.07, FT + 0.50);            // up front column lower
    s.lineTo(zF + 0.10, FT + 1.22);            // front column top-front
    s.lineTo(zF + 0.20, FT + 1.22);            // front column top-back
    s.lineTo(zF + 0.30, FT + 0.95);            // shoulder down
    s.lineTo(zF + 0.45, FT + 0.62);            // belly transition front (top)
    s.lineTo(bcz - 0.05, FT + 0.55);           // belly top middle
    s.lineTo(bcz + 0.05, FT + 0.55);           //
    s.lineTo(zB - 0.45, FT + 0.62);            // belly transition back (top)
    s.lineTo(zB - 0.30, FT + 0.95);            // shoulder up to saddle
    s.lineTo(zB - 0.18, FT + 0.95);            // saddle column top-front
    s.lineTo(zB - 0.05, FT + 0.95);            // saddle column top-back
    s.lineTo(zB - 0.05, FT + 0.10);            // back column down
    s.lineTo(zB - 0.20, FT + 0.32);            // belly bottom transition (back)
    s.lineTo(bcz,        FT + 0.25);            // belly bottom middle
    s.lineTo(zF + 0.30, FT + 0.32);            // belly bottom transition (front)
    s.lineTo(zF + 0.07, FT + 0.10);            // close
    return s;
  }
  var sideGeo = new THREE.ExtrudeGeometry(sideProfile(),
    { depth: 0.006, bevelEnabled: false }
  );
  function addSidePanel(side){
    var m = new THREE.Mesh(sideGeo, mFrame);
    m.rotation.y = -Math.PI/2;
    m.position.set(bcx + side * 0.075 + 0.003, 0, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }
  addSidePanel(+1);
  addSidePanel(-1);

  // ⑤ 사이드 패널 사이 충진 — 컬럼 두께감 부여 ────────────────────
  B(0.13, 1.05, 0.13, mFrame, bcx, FT + 0.575, zF + 0.13);   // 앞 컬럼 코어
  B(0.10, 0.78, 0.10, mFrame, bcx, FT + 0.49,  zB - 0.10);   // 뒤 컬럼 코어
  B(0.12, 0.20, 0.10, mFrame, bcx, FT + 1.14,  zF + 0.13);   // 핸들바 마운트 베이스
  B(0.10, 0.10, 0.13, mFrame, bcx, FT + 0.95,  zB - 0.115);  // 안장 마운트 베이스
  B(0.12, 0.10, 0.40, mFrame, bcx, FT + 0.50,  bcz);          // belly 가로 strut

  // ⑥ 안장 + 조절 레일 ────────────────────────────────────────────
  B(0.04, 0.018, 0.32, mRail,  bcx, FT + 1.000, zB - 0.10);  // 수평 조절 레일
  B(0.05, 0.030, 0.05, mFrame, bcx, FT + 1.025, zB - 0.10);  // 클램프
  B(0.16, 0.040, 0.32, mSeat,  bcx, FT + 1.060, zB - 0.10);  // 안장 시트

  // ⑦ 핸들바 컬럼 + 조절 레일 + 가로바 ─────────────────────────────
  B(0.12, 0.05, 0.18, mFrame, bcx, FT + 1.235, zF + 0.16);   // 마운트 상단
  B(0.04, 0.018, 0.36, mRail, bcx, FT + 1.265, zF + 0.20);   // 핸들바 조절 레일
  B(0.05, 0.030, 0.06, mFrame, bcx, FT + 1.290, zF + 0.20);  // 핸들바 클램프
  B(0.42, 0.034, 0.034, mTape, bcx, FT + 1.320, zF + 0.16);  // 핸들바 메인 가로바

  // ⑦-1 드롭 + 시프터/브레이크 후드 (좌·우, 청록 액센트) ────────────
  function dropGrip(side){
    var gx = bcx + side * 0.21;
    // 위쪽 가로 그립 (테이프)
    B(0.05, 0.034, 0.18, mTape, gx, FT + 1.32, zF + 0.24);
    // 시프터/브레이크 후드 본체
    B(0.05, 0.06, 0.12, mFrame, gx, FT + 1.36, zF + 0.30);
    // 청록 액센트 (후드 측면)
    B(0.052, 0.012, 0.04, mAccent, gx, FT + 1.395, zF + 0.27);
    // 굽은 드롭 부분 (수직 실린더)
    var gDrop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.20, 12),
      mTape
    );
    gDrop.position.set(gx, FT + 1.21, zF + 0.36);
    gDrop.castShadow = true;
    scene.add(gDrop);
    // 끝 그립 (뒤로 휘는 부분)
    B(0.034, 0.16, 0.034, mTape, gx, FT + 1.13, zF + 0.45);
  }
  dropGrip(-1);
  dropGrip(+1);

  // ⑧ 코일 케이블 (앞 컬럼 → 핸들바, 작은 토러스 스택으로 표현) ────
  for (var ci = 0; ci < 8; ci++){
    var coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.004, 6, 16),
      mTape
    );
    coil.rotation.y = Math.PI/2;
    coil.position.set(bcx + 0.04, FT + 1.13 + ci * 0.012, zF + 0.20);
    scene.add(coil);
  }

  // ⑨ 디스플레이 화면 + 베젤 (대형, 핸들바 마운트 앞면) ─────────────
  B(0.32, 0.20, 0.018, mFrame,  bcx, FT + 1.18, zF + 0.06);
  B(0.30, 0.18, 0.022, mScreen, bcx, FT + 1.18, zF + 0.07);
  B(0.30, 0.004, 0.022, mAccent, bcx, FT + 1.10, zF + 0.075);   // 하단 액센트 라인

  // ⑩ 단일 쿨링 팬 (디스플레이 위, 우측 약간 편향) ──────────────────
  var fcx = bcx + 0.06;
  var fcy = FT + 1.50;
  var fcz = zF + 0.04;
  // 마운트 암 (디스플레이 → 팬)
  B(0.025, 0.20, 0.025, mFrame, fcx, FT + 1.40, zF + 0.05);
  // 팬 하우징 (그릴 패널)
  B(0.16, 0.18, 0.04, mFan, fcx, fcy, fcz);
  // 팬 블레이드 디스크
  var fb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.005, 16),
    mFanBl
  );
  fb.rotation.x = Math.PI/2;
  fb.position.set(fcx, fcy, fcz - 0.022);
  scene.add(fb);
  // 팬 그릴 격자 (가로/세로 얇은 라인)
  for (var fg = 0; fg < 4; fg++){
    B(0.16,   0.0015, 0.001, mFanBl, fcx,                    fcy - 0.07 + fg*0.045, fcz - 0.022);
    B(0.0015, 0.16,   0.001, mFanBl, fcx - 0.06 + fg*0.04,   fcy,                    fcz - 0.022);
  }

  // ⑪ 플라이휠 — 깨끗한 흰색 디스크 + 볼트 (블루 글로우 제거) ───────
  var fwR = 0.18;
  var fwY = FT + 0.30;
  var fwZ = zF + 0.32;
  var fwX = bcx - 0.085;
  // 메인 디스크
  var fwMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(fwR, fwR, 0.04, 32),
    mWheel
  );
  fwMesh.rotation.z = Math.PI/2;
  fwMesh.position.set(fwX, fwY, fwZ);
  fwMesh.castShadow = true;
  scene.add(fwMesh);
  // 외륜 어두운 림 (얇은 테두리)
  var rimRing = new THREE.Mesh(
    new THREE.TorusGeometry(fwR + 0.005, 0.006, 6, 40),
    mFrame
  );
  rimRing.rotation.y = Math.PI/2;
  rimRing.position.set(fwX - 0.022, fwY, fwZ);
  scene.add(rimRing);
  // 중심 허브
  var hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.040, 0.040, 0.05, 16),
    mHub
  );
  hub.rotation.z = Math.PI/2;
  hub.position.set(fwX - 0.025, fwY, fwZ);
  scene.add(hub);
  // 두 개의 볼트 (디스크 앞면 가시)
  function fwBolt(yo, zo){
    var b = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.012, 12),
      mBolt
    );
    b.rotation.z = Math.PI/2;
    b.position.set(fwX - 0.026, fwY + yo, fwZ + zo);
    scene.add(b);
  }
  fwBolt( 0.06, 0.04);
  fwBolt(-0.06, 0.04);

  // ⑫ 크랭크 + 페달 (조각된 암 + 페달 핀) ──────────────────────────
  var crkY = FT + 0.18, crkZ = zF + 0.55;
  function pedal(side){
    var px = bcx + side * 0.10;
    // 크랭크 암
    B(0.035, 0.18, 0.04, mFrame, px, crkY, crkZ);
    // 플랫 페달
    B(0.10, 0.020, 0.075, mFrame, px, crkY - 0.09, crkZ);
    // 페달 그립 핀 (4개)
    for (var pi = 0; pi < 2; pi++){
      for (var pj = 0; pj < 2; pj++){
        var pin = new THREE.Mesh(
          new THREE.SphereGeometry(0.003, 6, 4),
          mBolt
        );
        pin.position.set(px - 0.025 + pi*0.05, crkY - 0.080, crkZ - 0.020 + pj*0.04);
        scene.add(pin);
      }
    }
  }
  pedal(-1);
  pedal(+1);

  // ⑬ 물병 + 홀더 (어두운 회색 + 청록 라벨 라인) ────────────────────
  var btX = bcx, btY = FT + 0.74, btZ = zF + 0.27;
  B(0.07, 0.10, 0.04, mTape, btX, btY, btZ + 0.04);              // 홀더
  var bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, 0.20, 16),
    mBottle
  );
  bottle.position.set(btX, btY + 0.04, btZ + 0.05);
  bottle.castShadow = true;
  scene.add(bottle);
  // 청록 라벨 라인 (물병 둘레)
  var bottleLabel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0345, 0.0345, 0.022, 16),
    mAccent
  );
  bottleLabel.position.set(btX, btY + 0.02, btZ + 0.05);
  scene.add(bottleLabel);
  // 병 뚜껑
  B(0.04, 0.020, 0.04, mFrame, btX, btY + 0.16, btZ + 0.05);

  // ⑭ 벤트 그릴 (사이드 패널, 작은 점 패턴) ────────────────────────
  function ventGrille(side, gz, gy){
    for (var vi = 0; vi < 4; vi++){
      for (var vj = 0; vj < 4; vj++){
        var dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.003, 6, 4),
          mFrameL
        );
        dot.position.set(bcx + side * 0.082, FT + gy + vi*0.012, gz + vj*0.012);
        scene.add(dot);
      }
    }
  }
  ventGrille(+1, zF + 0.08, 0.40);
  ventGrille(+1, zB - 0.20, 0.45);
  ventGrille(-1, zB - 0.20, 0.45);

  // ⑮ 녹색 LED 인디케이터 (플라이휠 옆, 두 개) ─────────────────────
  for (var li = 0; li < 2; li++){
    var led = new THREE.Mesh(
      new THREE.SphereGeometry(0.007, 8, 6),
      mLED
    );
    led.position.set(bcx - 0.082, FT + 0.50, zF + 0.20 + li*0.035);
    scene.add(led);
  }
})();

// @FURN#48 침실2 침대
// ── 침실2 퀸사이즈 침대 (머리 → 아래쪽 벽, 좌우 중앙) ──
// 침실2: x=xBal~xKit (폭 3.6m), z=zLR2~zB / 퀸 사이즈
defineFurniture({
  id: 48, name: '침실2 침대', room: '침실 2',
  pos:   { cx: (xBal + xKit) / 2, wallZ: zB - WT/2 },   // 좌우 중앙 = 3.3, 아래쪽 벽 내면 ≈ 6.54
  frame: { W: 1.65, H: 0.22, D: 2.05 },                  // @ESTIMATE 베드 프레임
  head:  { W: 1.65, H: 0.55, D: 0.10 },                  // @ESTIMATE 헤드보드
  matt:  { W: 1.52, H: 0.20, D: 1.88 },                  // @ESTIMATE 매트리스
  pillow:{ W: 0.58, H: 0.10, D: 0.38 },                  // @ESTIMATE 베개 2개
  foot:  { W: 1.65, H: 0.35, D: 0.08 },                  // @ESTIMATE 풋보드
  bbox:  [2.475, 4.49, 4.125, 6.54],
}, function(spec){
  var cx = spec.pos.cx, wallZ = spec.pos.wallZ;
  var woodMat = makeLambert(PAL.wood.bedFrame);
  var mattMat = makeLambert(PAL.fabric.mattress);
  var pilMat  = makeLambert(PAL.fabric.pillow);

  function box(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
  }

  // 1) 베드 프레임 (낮은 나무 플랫폼)
  var f = spec.frame;
  box(new THREE.BoxGeometry(f.W, f.H, f.D), woodMat, cx, FT + f.H/2, wallZ - f.D/2);

  // 2) 헤드보드 (침대 머리판, 벽에 밀착)
  var h = spec.head;
  box(new THREE.BoxGeometry(h.W, h.H, h.D), woodMat, cx, FT + h.H/2, wallZ - h.D/2);

  // 3) 매트리스 (프레임 위, 헤드보드 앞부터)
  var m = spec.matt;
  var mZ = wallZ - h.D - m.D/2;        // 헤드보드 앞면부터 앞쪽으로
  box(new THREE.BoxGeometry(m.W, m.H, m.D), mattMat, cx, FT + f.H + m.H/2, mZ);

  // 4) 베개 2개 (매트리스 머리쪽)
  var p = spec.pillow;
  var pY = FT + f.H + m.H + p.H/2;
  var pZ = wallZ - h.D - p.D/2 - 0.06; // 헤드보드 앞에 바짝
  var pGeo = new THREE.BoxGeometry(p.W, p.H, p.D);
  box(pGeo, pilMat, cx - 0.41, pY, pZ); // 왼쪽 베개
  box(pGeo, pilMat, cx + 0.41, pY, pZ); // 오른쪽 베개

  // 5) 풋보드 (발치 낮은 판)
  var fo = spec.foot;
  var foZ = wallZ - f.D - fo.D/2;
  box(new THREE.BoxGeometry(fo.W, fo.H, fo.D), woodMat, cx, FT + fo.H/2, foZ);
});

// @FURN#49 침실1 책상
// ── 침실1 책상 (오른쪽 벽 x=10.5 중앙, 가로 80cm × 세로 180cm) ──
// 침실1: x=xBR~xHall, z=zT~zM1  /  오른쪽 벽 내면: x = xHall - WT/2 = 10.44
defineFurniture({
  id: 49, name: '침실1 책상', room: '침실 1',
  size: {
    dW:    0.80,  // 깊이 (벽에서 방 안쪽, x 방향) @ESTIMATE
    dD:    1.80,  // 길이 (벽을 따라, z 방향) — 1800mm @ESTIMATE
    topH:  0.04,  // 상판 두께
    deskH: 0.74,  // 바닥에서 상판 상면까지 (표준 책상 높이) @ESTIMATE
    legS:  0.06,  // 다리 단면 한 변
  },
  bbox: [9.64, 0.45, 10.44, 2.25],
}, function(spec){
  var s = spec.size;
  var wallX = xHall - WT/2;            // 오른쪽 벽 내면 x ≈ 10.44
  var cz    = (zT + zM1) / 2;          // 침실1 z 중앙 = 1.35
  var cx    = wallX - s.dW/2;          // 책상 x 중심 ≈ 10.04

  var deskMat = makeLambert(PAL.wood.deskTop);   // PAL.wood.deskTop (밝은 오크)
  var legMat  = makeLambert(PAL.wood.deskLegs);  // PAL.wood.deskLegs (진한 오크)

  // 상판
  B(s.dW, s.topH, s.dD, deskMat, cx, FT + s.deskH - s.topH/2, cz);

  // 다리 4개 (상판 모서리 안쪽)
  var legH = s.deskH - s.topH;
  var legY = FT + legH/2;
  var lx   = wallX - s.dW + s.legS/2;  // 방 안쪽 다리 x
  var rx   = wallX - s.legS/2;         // 벽쪽 다리 x
  var fz   = cz - s.dD/2 + s.legS/2;   // 앞쪽 다리 z
  var bz   = cz + s.dD/2 - s.legS/2;   // 뒤쪽 다리 z
  [lx, rx].forEach(function(lx_) {
    [fz, bz].forEach(function(lz_) {
      B(s.legS, legH, s.legS, legMat, lx_, legY, lz_);
    });
  });
});

// @FURN#64..66 침실1 책꽂이 1~3 (3개 인스턴스, 폭 1.20/1.20/1.60m, 5단)
// ── 침실1 오픈 책꽂이 (벽 59에 등 기댐, 깊이 25cm × 높이 1.80m) ────
// @FURN#64: 북측 벽(z=0) 우측, 폭 1.20m — 우측면이 벽 74에 기댐 (rightX = xHall-WT/2 = 10.44)
// @FURN#65: 북측 벽(z=0) 좌측, 폭 1.20m — @FURN#64 좌측에 인접
// @FURN#66: 남측 벽(z=2.7) 우측, 폭 1.60m — 동측 벽에 우측면 기댐 (북측 2 책꽂이와 z 미러)
// 책상(@FURN#49, z=0.45~2.25)과 충돌 없음 — 책꽂이 z=0.06~0.31, 남측 z=2.39~2.64.
(function(){
  var caseMat = new THREE.MeshLambertMaterial({color:0xc8a878});  // 밝은 우드
  var bookMats = [
    new THREE.MeshLambertMaterial({color:0x4a3018}),  // 갈색
    new THREE.MeshLambertMaterial({color:0x1a4a78}),  // 파랑
    new THREE.MeshLambertMaterial({color:0x6a1a1a}),  // 진빨강
    new THREE.MeshLambertMaterial({color:0x4a6a3a}),  // 진녹
    new THREE.MeshLambertMaterial({color:0xeae6dc}),  // 베이지
    new THREE.MeshLambertMaterial({color:0x202028}),  // 검정
    new THREE.MeshLambertMaterial({color:0xb88840}),  // 주황 갈색
    new THREE.MeshLambertMaterial({color:0x303040}),  // 어두운 청회색
    new THREE.MeshLambertMaterial({color:0xc83838}),  // 빨강
    new THREE.MeshLambertMaterial({color:0xd4b878})   // 황토
  ];

  // 한 개 책꽂이 생성 — rightX: 우측면 x, seedSalt: 책 패턴 다양화,
  // backZ: 등 기댄 벽 z (기본 WT/2 = 북측 벽), openDir: 개방 방향 (+1 +z, -1 -z),
  // width: 폭 (기본 0.80m)
  function makeBookcase(rightX, seedSalt, backZ, openDir, width){
    if (backZ === undefined) backZ = WT/2;          // 기본: 침실1 북측 벽
    if (openDir === undefined) openDir = 1;         // 기본: +z 방향 개방
    if (width === undefined) width = 0.80;          // 기본: 0.80m

    var sxR = rightX;
    var sxL = sxR - width;
    var szB = backZ;                                 // 후면 (벽 측)
    var szF = szB + openDir * 0.25;                  // 전면 (개방 측)
    var syB = FT;
    var syT = FT + 1.80;
    var cx_ = (sxL + sxR) / 2;
    var cy_ = (syB + syT) / 2;
    var cz_ = (szB + szF) / 2;
    var w_  = sxR - sxL;
    var h_  = syT - syB;
    var d_  = 0.25;                                  // 깊이 (절대값)
    var pt  = 0.018;
    var pof = openDir * pt/2;                        // 패널 z 오프셋 (캐비닛 내부 방향)

    // 5면 hollow 본체 (전면 openDir 방향 개방)
    B(w_,        h_,        pt,        caseMat, cx_,         cy_,             szB + pof);   // 후판
    B(w_-pt*2,   pt,        d_-pt,     caseMat, cx_,         syT-pt/2,        cz_ + pof);   // 상판
    B(w_-pt*2,   pt,        d_-pt,     caseMat, cx_,         syB+pt/2,        cz_ + pof);   // 하판
    B(pt,        h_-pt*2,   d_-pt,     caseMat, sxL+pt/2,    cy_,             cz_ + pof);   // 좌측판
    B(pt,        h_-pt*2,   d_-pt,     caseMat, sxR-pt/2,    cy_,             cz_ + pof);   // 우측판

    // 내부 선반 4단 → 5 compartment
    var nShelves = 4;
    var shelfYs = [];
    for (var si = 1; si <= nShelves; si++){
      var shY = syB + (si / (nShelves + 1)) * h_;
      shelfYs.push(shY);
      B(w_-pt*2-0.005, 0.014, d_-pt-0.020, caseMat, cx_, shY, cz_ + pof);
    }

    // 책 배치 (seedSalt로 두 책꽂이의 책 색·높이 패턴이 달라지도록)
    function placeBooks(shelfTopY, xStart, count, heightVar){
      var bookW = 0.034;
      var bookD = 0.18;
      for (var bi = 0; bi < count; bi++){
        var matIdx = (bi * 3 + Math.round(xStart * 11) + Math.round(shelfTopY * 7) + seedSalt) % bookMats.length;
        var bookH = heightVar ? (0.20 + ((bi * 17 + seedSalt * 5) % 6) * 0.012) : 0.22;
        var bookCenterX = xStart + bookW/2 + bi * bookW;
        // 책은 후판에 기대어 정렬 (후판 안쪽 면 + bookD/2 + 살짝 띄움)
        var bookCenterZ = szB + openDir * (pt + bookD/2 + 0.008);
        B(bookW * 0.92, bookH, bookD, bookMats[matIdx], bookCenterX, shelfTopY + bookH/2, bookCenterZ);
      }
    }
    placeBooks(syB + pt,                sxL + 0.04,  8, true);
    placeBooks(shelfYs[0] + 0.014/2,    sxL + 0.03, 12, true);
    placeBooks(shelfYs[1] + 0.014/2,    sxL + 0.05,  6, true);
    placeBooks(shelfYs[2] + 0.014/2,    sxL + 0.025,14, true);
    placeBooks(shelfYs[3] + 0.014/2,    sxL + 0.04,  5, true);
  }

  // === 북측 벽(z=0) 측 — 침실1 북쪽 벽, 2개 (각 폭 1.20m, 총 2.40m) ===
  // @FURN#64: 우측면이 벽 74에 기댐 (NE 코너), 폭 1.20m
  makeBookcase(xHall - WT/2,         0,  WT/2,        1, 1.20);
  // @FURN#65: @FURN#64 좌측에 인접, 폭 1.20m (남은 벽 면적 끝까지 연속)
  makeBookcase(xHall - WT/2 - 1.20,  7,  WT/2,        1, 1.20);

  // === 남측 벽(z=2.7) 측 — 1개 (폭 1.60m) ===
  // @FURN#66: 동측 벽(x=10.5)에 우측면 기댐, 북측 책꽂이와 z 미러. 폭 1.60m
  makeBookcase(xHall - WT/2,        20, zM1 - WT/2, -1, 1.60);
})();

// @FURN#67 벽걸이 로드 자전거
// ── 침실1 벽걸이 로드 자전거 (벽 76 = 주방·침실1 경계 x=7.8, 침실1 측) ───
// Specialized S-Works Tarmac 스타일 (그린/블랙 그라데이션, 카본 휠).
// 수평 마운트: 바이크 좌측면이 벽에 붙고, 휠축이 x 방향으로 향함 (정면이 -x 방향).
(function(){
  // 위치 — 침실1 측, 벽 내면 x=7.86에서 20cm 떨어져서 매달림 (실제 자전거 거리감)
  var bx       = xBR + WT/2 + 0.20;        // 8.06 (바이크 중심 x)
  var hubY     = 0.90;                      // 휠 허브 y 높이 (어깨 정도)
  var zRear    = 0.85;                       // 뒷 휠 z 중심
  var zFront   = 1.95;                       // 앞 휠 z 중심
  var wheelR   = 0.325;                      // 700c 외경 ~0.65m
  var rimDepth = 0.040;                      // 카본 림 깊이

  // 재질 — S-Works 그린 카본 + 디테일
  var mGreen  = new THREE.MeshPhongMaterial({color:0x0e3a22, specular:0x4a8a5a, shininess:90});
  var mGreenL = new THREE.MeshPhongMaterial({color:0x1a5a36, specular:0x60a070, shininess:80});
  var mTire   = new THREE.MeshLambertMaterial({color:0x181818});
  var mRim    = new THREE.MeshPhongMaterial({color:0x2c2c2e, specular:0x404048, shininess:80});
  var mTan    = new THREE.MeshLambertMaterial({color:0xc88a3e});                  // 탠/오렌지 타이어 라벨
  var mSaddle = new THREE.MeshPhongMaterial({color:0x080808, specular:0x303030, shininess:50});
  var mBar    = new THREE.MeshLambertMaterial({color:0x0c0c0c});                  // 핸들바 테이프
  var mCrank  = new THREE.MeshPhongMaterial({color:0x101012, specular:0x404044, shininess:90});
  var mGear   = new THREE.MeshPhongMaterial({color:0xb88a40, specular:0xd0b070, shininess:140});
  var mLogo   = new THREE.MeshLambertMaterial({color:0xeae6dc});                  // S-WORKS 흰 글자
  var mHook   = new THREE.MeshPhongMaterial({color:0x404048, specular:0x808088, shininess:120});

  /* 1) 양 휠 (TorusGeometry 타이어 + 카본 림 + 허브 + 스포크) */
  function wheel(zCenter){
    // 타이어 (외륜 토러스)
    var tire = new THREE.Mesh(
      new THREE.TorusGeometry(wheelR, 0.020, 8, 32),
      mTire
    );
    tire.rotation.y = Math.PI/2;            // 축이 x 방향
    tire.position.set(bx, hubY, zCenter);
    tire.castShadow = true;
    scene.add(tire);
    // 카본 딥 림
    var rim = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR-0.020, wheelR-0.020, rimDepth, 28, 1, true),
      mRim
    );
    rim.rotation.z = Math.PI/2;             // 축 x 방향
    rim.position.set(bx, hubY, zCenter);
    scene.add(rim);
    // 허브
    var hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.06, 12),
      mCrank
    );
    hub.rotation.z = Math.PI/2;
    hub.position.set(bx, hubY, zCenter);
    scene.add(hub);
    // 탠 스트라이프 (방쪽 면, x=bx+rimDepth/2 살짝 바깥)
    var stripe = new THREE.Mesh(
      new THREE.TorusGeometry(wheelR-0.005, 0.005, 6, 32),
      mTan
    );
    stripe.rotation.y = Math.PI/2;
    stripe.position.set(bx + rimDepth/2 + 0.002, hubY, zCenter);
    scene.add(stripe);
    // 스포크 8개 (단순화)
    for (var s = 0; s < 8; s++){
      var ang = (s/8) * Math.PI * 2;
      var spoke = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0015, 0.0015, (wheelR-0.025)*2, 4),
        mRim
      );
      spoke.position.set(bx, hubY, zCenter);
      spoke.rotation.x = ang;               // y축 cylinder를 z 평면 안에서 회전
      scene.add(spoke);
    }
  }
  wheel(zRear);
  wheel(zFront);

  /* 2) 프레임 튜브 (zy 평면 내 cylinder) */
  function tube(z1, y1, z2, y2, radius, mat){
    var dz = z2-z1, dy = y2-y1;
    var len = Math.sqrt(dz*dz + dy*dy);
    var t = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, len, 12),
      mat
    );
    t.position.set(bx, (y1+y2)/2, (z1+z2)/2);
    var dir = new THREE.Vector3(0, dy/len, dz/len);
    t.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    t.castShadow = true;
    scene.add(t);
  }

  // 프레임 핵심점
  var bbZ      = zRear + 0.50;             // 보텀 브래킷 z (앞 휠 향해 약간)
  var bbY      = hubY - 0.05;              // BB y (휠 허브 약간 아래)
  var headTopZ = zFront - 0.04;
  var headTopY = hubY + 0.42;              // 헤드 튜브 상단
  var seatTopZ = bbZ - 0.10;
  var seatTopY = bbY + 0.66;               // 시트 포스트 상단

  // 다이아몬드 프레임
  tube(headTopZ, headTopY, seatTopZ, seatTopY, 0.018, mGreen);  // 톱 튜브
  tube(headTopZ, headTopY, bbZ,      bbY,      0.024, mGreen);  // 다운 튜브 (굵음)
  tube(bbZ,      bbY,      seatTopZ, seatTopY, 0.018, mGreen);  // 시트 튜브
  tube(bbZ,      bbY,      zRear,    hubY,     0.013, mGreenL); // 체인스테이
  tube(seatTopZ, seatTopY, zRear,    hubY,     0.011, mGreenL); // 시트스테이
  tube(headTopZ, headTopY, zFront,   hubY,     0.013, mGreenL); // 프론트 포크
  // 헤드 튜브 (짧은 수직)
  tube(headTopZ, headTopY, headTopZ, headTopY-0.10, 0.022, mGreen);

  /* 3) 안장 (시트 포스트 위) */
  var saddle = new THREE.Mesh(
    new THREE.BoxGeometry(0.030, 0.025, 0.22),
    mSaddle
  );
  saddle.position.set(bx, seatTopY+0.02, seatTopZ-0.06);
  saddle.castShadow = true;
  scene.add(saddle);
  // 안장 코 (앞쪽 살짝 좁아짐)
  var nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.016, 0.06),
    mSaddle
  );
  nose.position.set(bx, seatTopY+0.018, seatTopZ-0.20);
  scene.add(nose);

  /* 4) 핸들바 (드롭바) */
  // 위쪽 가로바 (x 방향) — 단순화하여 z 방향 짧은 가로
  var hbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.10, 8),
    mBar
  );
  hbar.rotation.x = Math.PI/2;             // 축 z 방향
  hbar.position.set(bx, headTopY+0.04, headTopZ+0.06);
  scene.add(hbar);
  // 드롭 (헤드에서 +z 방향으로 내려감)
  var drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.16, 8),
    mBar
  );
  drop.position.set(bx, headTopY-0.02, headTopZ+0.18);
  drop.rotation.x = -Math.PI/3;            // 비스듬히 +z, -y로
  scene.add(drop);
  // 스템 (헤드 → 핸들바 연결)
  var stem = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.022, 0.08),
    mGreen
  );
  stem.position.set(bx, headTopY+0.03, headTopZ+0.02);
  scene.add(stem);

  /* 5) 크랭크 + 체인링 (BB 위치) */
  var crank = new THREE.Mesh(
    new THREE.BoxGeometry(0.020, 0.085, 0.034),
    mCrank
  );
  crank.position.set(bx + 0.025, bbY-0.03, bbZ);
  crank.rotation.x = Math.PI/8;            // 약간 비스듬한 페달 위치
  scene.add(crank);
  // 체인링 (큰 원형 톱니)
  var chainring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.10, 0.006, 32),
    mGear
  );
  chainring.rotation.z = Math.PI/2;
  chainring.position.set(bx + 0.022, bbY, bbZ);
  scene.add(chainring);
  // 작은 체인링 (안쪽)
  var chainringS = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.005, 24),
    mGear
  );
  chainringS.rotation.z = Math.PI/2;
  chainringS.position.set(bx + 0.012, bbY, bbZ);
  scene.add(chainringS);

  /* 6) 벽 마운트 후크 (벽에서 자전거 헤드까지 20cm 가로 암) */
  var hookBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.015, 12),
    mHook
  );
  hookBase.rotation.z = Math.PI/2;
  hookBase.position.set(xBR + WT/2 + 0.008, headTopY + 0.18, headTopZ+0.05);
  scene.add(hookBase);
  // 후크 암 — 벽 내면(x=7.86)에서 자전거 위치(x=8.06)까지 약 22cm 길이
  var hookArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8),
    mHook
  );
  hookArm.rotation.z = Math.PI/2;
  hookArm.position.set(xBR + WT/2 + 0.11, headTopY + 0.18, headTopZ+0.05);  // 7.97 (중심)
  scene.add(hookArm);
  // 후크 끝 (자전거 프레임 잡는 J-hook 부분)
  var hookEnd = new THREE.Mesh(
    new THREE.TorusGeometry(0.018, 0.005, 6, 12, Math.PI),
    mHook
  );
  hookEnd.rotation.y = -Math.PI/2;
  hookEnd.position.set(bx - 0.01, headTopY + 0.18 - 0.018, headTopZ+0.05);
  scene.add(hookEnd);

  /* 7) S-WORKS 로고 (다운 튜브, 흰 글자) */
  var logo = new THREE.Mesh(
    new THREE.BoxGeometry(0.001, 0.030, 0.18),
    mLogo
  );
  // 다운 튜브 중앙 정도 (헤드와 BB 사이)
  var lx = bx + 0.025;
  var ly = (headTopY + bbY) / 2;
  var lz = (headTopZ + bbZ) / 2;
  logo.position.set(lx, ly, lz);
  scene.add(logo);

  /* 8) 추가 디테일 — 디스크 브레이크 로터 (앞·뒤 휠 안쪽) */
  function rotor(zCenter){
    var r = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.003, 24),
      mRim
    );
    r.rotation.z = Math.PI/2;
    r.position.set(bx - rimDepth/2 - 0.003, hubY, zCenter);
    scene.add(r);
  }
  rotor(zRear);
  rotor(zFront);
})();

// @FURN#50 현관 신발장
// ── 현관 신발장 (녹색 바닥, 좌측 2칸) + 우측 1칸 기둥 ──
// 녹색 현관: x=8.7~10.5, z=2.7~4.2
// 신발장 가로: 창고 문 끝(x=8.7)에서 1.18m → x=8.7~9.88 (2칸)
// 우측 기둥(방 15): x=9.88~10.44, 방 14 참고 (mWall, 전고 솔리드)
// 세로: 0.37m (문 끝 z=3.75 ~ 벽 내면 z=4.14 - 2cm)
// 높이: 천장까지 CH=2.4m
(function() {
  var cD     = 0.37;
  var cH     = CH;
  var wallZ  = zM2 - WT/2;                  // 4.14 (뒷벽 내면)
  var cBaseX = xBR + DW;                    // 8.70 (좌측 시작)
  var cRightX= xHall - WT/2;                // 10.44 (우측 끝, 복도벽 내면)

  // === 신발장 (좌측 2칸) ===
  var cW   = 1.18;                          // panelW 0.56 × 2 + 간격 0.06 = 1.18m
  var cx   = cBaseX + cW/2;                 // 9.29
  var cy   = cH / 2;
  var cz   = wallZ - cD / 2;                 // 3.955 (z 중심)

  var bodyMat  = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  var innerMat = new THREE.MeshLambertMaterial({ color: 0xd8cfc0 });  // 내부 측 (살짝 어둡게)
  var shelfMat = new THREE.MeshLambertMaterial({ color: 0xc8b896 });  // 우드톤 선반
  var handleMat= new THREE.MeshLambertMaterial({ color: 0x909090 });

  // 1) 5면 hollow 본체 (전면 -z 개방, 양문형 도어 열면 내부 노출) ───
  //    냉장고 hollowFridgeColumn과 동일 구조.
  var pt = 0.018;                                   // 판재 두께
  var z1B = wallZ - cD;                             // 3.77 (전면)
  var z2B = wallZ;                                  // 4.14 (후면, 뒷벽 내면)
  // 후판
  B(cW,        cH,       pt,        bodyMat, cx,                 cy,            z2B-pt/2);
  // 상판
  B(cW-pt*2,   pt,       cD-pt,     bodyMat, cx,                 FT+cH-pt/2,   cz-pt/2);
  // 하판 (cabinet floor, 위에 신발 직접 놓을 수 있음)
  B(cW-pt*2,   pt,       cD-pt,     bodyMat, cx,                 FT+pt/2,       cz-pt/2);
  // 좌측판
  B(pt,        cH-pt*2,  cD-pt,     bodyMat, cBaseX+pt/2,        cy,            cz-pt/2);
  // 우측판
  B(pt,        cH-pt*2,  cD-pt,     bodyMat, cBaseX+cW-pt/2,     cy,            cz-pt/2);

  // 2) 신발 선반 5단 (6 compartment, 각 ~40cm 높이) ───────────────
  var nShelves = 5;
  for (var si = 1; si <= nShelves; si++){
    var shY = FT + (si / (nShelves+1)) * cH;        // 등간격
    B(cW-pt*2-0.005, 0.014, cD-pt-0.020, shelfMat, cx, shY, cz-pt/2);
  }

  // 3) 신발 예시 (몇 켤레, 단순 박스 페어로 표현) ────────────────
  var mShoeBlk = new THREE.MeshLambertMaterial({color:0x1a1a1c});  // 검정 운동화
  var mShoeBrn = new THREE.MeshLambertMaterial({color:0x4a3018});  // 갈색 구두
  var mShoeWht = new THREE.MeshLambertMaterial({color:0xeae6dc});  // 흰색 운동화
  var mShoeRed = new THREE.MeshLambertMaterial({color:0x8a2222});  // 빨강 운동화
  function shoePair(mat, sx, sy, sz){
    // 좌·우 신발 각 0.10×0.07×0.24 (w×h×d), 6.5cm 간격으로 한 켤레
    B(0.10, 0.07, 0.24, mat, sx - 0.055, sy + 0.035, sz);
    B(0.10, 0.07, 0.24, mat, sx + 0.055, sy + 0.035, sz);
  }
  // 선반 si의 위쪽 y (선반 두께 14mm 위, 신발 바닥 = 선반 상면)
  function shelfTopY(si){ return FT + (si/(nShelves+1))*cH + 0.014/2; }
  var sZ = cz - 0.04;                                // 신발 z 중심 (선반 안쪽 약간 앞)
  // 0단(바닥) — 검정 + 흰색 운동화
  shoePair(mShoeBlk, cBaseX + 0.32, FT + pt/2, sZ);
  shoePair(mShoeWht, cBaseX + 0.86, FT + pt/2, sZ);
  // 1단 위 — 갈색 구두
  shoePair(mShoeBrn, cBaseX + 0.50, shelfTopY(1), sZ);
  // 2단 위 — 빨강 운동화
  shoePair(mShoeRed, cBaseX + 0.85, shelfTopY(2), sZ);
  // 3단 위 — 검정 + 갈색
  shoePair(mShoeBlk, cBaseX + 0.32, shelfTopY(3), sZ);
  shoePair(mShoeBrn, cBaseX + 0.86, shelfTopY(3), sZ);

  // 4) 양문형 인터랙티브 도어 — 코드 후반부 IIFE에서 등록
  //    문 36 (신발장 좌) + 문 37 (신발장 우), _doors[20], _doors[21]

  // === 우측 기둥 (방 15) — 방 14 배관 기둥과 동일 형태 (mWall, 전고) ===
  var colW  = cRightX - (cBaseX + cW);       // 0.56 (10.44 - 9.88)
  var colCx = (cBaseX + cW + cRightX) / 2;   // 10.16
  B(colW, CH, cD, mWall, colCx, CH/2, cz);
})();

// @FURN#68 창고 붙박이장
// ── 창고 붙박이장 (벽 83 = 창고 서쪽 벽 x=7.8, 6-door 인터랙티브) ────
// 위치: 창고(x=7.8~10.5, z=4.2~6.6) — 좌측면이 벽 83 내면 부근, 등은 z=6.6 외벽
// 크기: 2.40m 폭 × 0.60m 깊이 × 2.35m 높이 (바닥~천장)
// 도어: 6짝 (L-R-L-R-L-R), 각 0.40m, 한 쌍 0.80m, 총 3 미러 페어 -z 개방
(function(){
  var wW   = 2.40;                            // 폭 (1.80 -> 2.40)
  var wD   = 0.60;                            // 깊이
  var wH   = CH - FT;                         // 높이 = 2.35m

  // x 위치: 좌측면이 벽 83 내면(x=7.86)에서 2cm 클리어런스 (도어 회전 여유)
  var wallGap = 0.02;
  var wxL  = xBR + WT/2 + wallGap;            // 7.88 (좌측면)
  var wxR  = wxL + wW;                         // 10.28 (우측면) — 동벽 내면 10.44에서 16cm
  var wcx  = (wxL + wxR) / 2;                  // 9.08
  var zBack  = zB - WT/2;                      // 6.54 (남측 외벽 내면, 등 기댐)
  var zFront = zBack - wD;                     // 5.94 (캐비닛 전면)
  var wcz  = (zBack + zFront) / 2;             // 6.24
  var wcy  = FT + wH/2;                        // 1.225

  /* 재질 — 화이트 미니멀 + 액센트 */
  var bodyMat  = new THREE.MeshLambertMaterial({color:0xf2efe6});
  var doorMat  = new THREE.MeshPhongMaterial({color:0xf6f3ea, specular:0x303030, shininess:25});
  var trimMat  = new THREE.MeshLambertMaterial({color:0xeae6db});
  var seamMat  = new THREE.MeshLambertMaterial({color:0x202020});
  var plintMat = new THREE.MeshLambertMaterial({color:0x4a4a4c});
  var grooveMat= new THREE.MeshLambertMaterial({color:0x404040});

  /* 1) 본체 5면 hollow + 3단 글래스 선반 (가구 53 참고) ─────────────
     전면 -z 개방, 도어 열면 흰 라이닝 내부와 선반이 노출됨.
     냉장고/수납장(가구 53)의 hollowFridgeColumn 구조를 그대로 적용. */
  var mInner = new THREE.MeshLambertMaterial({color:0xfafafa});                         // 흰 라이닝
  var mShelf = new THREE.MeshPhongMaterial({                                              // 글래스 선반
    color:0xe0e8ee, specular:0xfafafa, shininess:140,
    transparent:true, opacity:0.55, side:THREE.DoubleSide
  });
  var pt = 0.018;                                                                         // 패널 두께
  // 5면 hollow (후·상·하·좌·우, 전면 z=zFront 개방)
  B(wW,        wH,        pt,        mInner, wcx,         wcy,            zBack-pt/2);   // 후판
  B(wW-pt*2,   pt,        wD-pt,     mInner, wcx,         FT+wH-pt/2,     wcz-pt/2);     // 상판
  B(wW-pt*2,   pt,        wD-pt,     mInner, wcx,         FT+pt/2,        wcz-pt/2);     // 하판
  B(pt,        wH-pt*2,   wD-pt,     mInner, wxL+pt/2,    wcy,            wcz-pt/2);     // 좌측판
  B(pt,        wH-pt*2,   wD-pt,     mInner, wxR-pt/2,    wcy,            wcz-pt/2);     // 우측판
  // 3단 글래스 선반 (1/4, 2/4, 3/4 높이) — 가구 53과 동일 배치
  for (var si = 1; si <= 3; si++){
    var shY = FT + (si / 4) * wH;
    B(wW-pt*2-0.005, 0.010, wD-pt-0.020, mShelf, wcx, shY, wcz-pt/2);
  }

  /* 2) 도어 4짝 — 인터랙티브 (L-R-L-R 힌지 패턴) */
  var nDoor   = 6;
  var dT      = 0.020;
  var dW      = wW / nDoor;                    // 0.45m
  var dGap    = 0.005;
  var dPanelW = dW - dGap;                     // 0.445m
  var topTrimH= 0.06;
  var botPlH  = 0.025;
  var dH      = wH - topTrimH - botPlH;        // 도어 높이 (2.265m)
  var dCY     = FT + botPlH + dH/2;            // 도어 y 중심
  var gY_     = FT + wH - topTrimH - 0.020;    // 푸시오픈 그루브 y

  // 힌지 패턴 L,R,L,R — 페어 (1,2)(3,4)가 미러 프렌치 도어
  var hSides = ['left','right','left','right','left','right'];
  for (var di = 0; di < nDoor; di++){
    var dLeft = wxL + di * dW;                  // 도어 좌측 x
    var hSide = hSides[di];
    var hX    = (hSide === 'left') ? dLeft : (dLeft + dW);
    var dlx   = (hSide === 'left') ? dPanelW/2 : -dPanelW/2;
    var oRY   = (hSide === 'left') ? Math.PI/2 : -Math.PI/2;

    var pivot = new THREE.Object3D();
    pivot.position.set(hX, 0, zFront);
    scene.add(pivot);

    // 도어 패널
    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(dPanelW, dH, dT),
      doorMat
    );
    panel.position.set(dlx, dCY, -dT/2);
    panel.castShadow = true;
    panel.receiveShadow = true;
    pivot.add(panel);

    // 푸시오픈 그루브 (도어 상단, 도어와 함께 회전)
    var groove = new THREE.Mesh(
      new THREE.BoxGeometry(dPanelW * 0.85, 0.008, 0.002),
      grooveMat
    );
    groove.position.set(dlx, gY_, -dT - 0.001);
    pivot.add(groove);

    _doors.push({pivot:pivot, doorMesh:panel, openRY:oRY, isOpen:false});
  }

  /* 3) 도어 사이 솔기 (정적 — 도어 닫힌 상태에서 시각 분리, 열렸을 때는 보이지 않음) */
  for (var si = 1; si < nDoor; si++){
    var sxC = wxL + dW * si;
    B(0.003, dH, 0.008, seamMat, sxC, dCY, zFront - dT - 0.001);
  }
  // 좌·우 끝 솔기 (캐비닛 본체와의 경계)
  B(0.003, dH, 0.008, seamMat, wxL, dCY, zFront - dT - 0.001);
  B(0.003, dH, 0.008, seamMat, wxR, dCY, zFront - dT - 0.001);

  /* 4) 상단 트림 */
  B(wW, topTrimH, dT + 0.002, trimMat, wcx, FT + wH - topTrimH/2, zFront - dT/2);

  /* 5) 하단 플린스 */
  B(wW, botPlH, dT + 0.002, plintMat, wcx, FT + botPlH/2, zFront - dT/2);
})();

// @FURN#69 창고 붙박이장 2
// ── 창고 붙박이장 2 (벽 93 = 창고 북측 벽 z=4.2, 3-door 인터랙티브) ──
// 가구 67(붙박이장 1, 6-door)의 세 조각 버전. 폭 1.20m (3 × 0.40m).
// L-R-L 힌지 패턴 = 1 미러 페어(문1+2) + 단일 도어(문3).
// 위치: 벽 93(x=8.7~10.5, z=4.2) 가운데 정렬, +z 방향 개방.
(function(){
  var wW   = 1.20;                            // 폭 (3 도어 × 0.40m)
  var wD   = 0.60;
  var wH   = CH - FT;

  // 우측면이 벽 94(창고 동벽 x=10.5) 내면 10.44에 부착
  var wxR  = xHall - WT/2;                     // 10.44
  var wxL  = wxR - wW;                          // 9.24
  var wcx  = (wxL + wxR) / 2;                  // 9.84

  // z 위치: 등 기댐 = 벽 93 내면(창고 측), 전면 +z 개방
  var zBack  = zM2 + WT/2;                     // 4.26
  var zFront = zBack + wD;                     // 4.86
  var wcz  = (zBack + zFront) / 2;             // 4.56
  var wcy  = FT + wH/2;
  var openDir = +1;                            // +z 개방 (북측 벽)

  /* 재질 (가구 67과 동일) */
  var doorMat  = new THREE.MeshPhongMaterial({color:0xf6f3ea, specular:0x303030, shininess:25});
  var trimMat  = new THREE.MeshLambertMaterial({color:0xeae6db});
  var seamMat  = new THREE.MeshLambertMaterial({color:0x202020});
  var plintMat = new THREE.MeshLambertMaterial({color:0x4a4a4c});
  var grooveMat= new THREE.MeshLambertMaterial({color:0x404040});
  var mInner   = new THREE.MeshLambertMaterial({color:0xfafafa});
  var mShelf   = new THREE.MeshPhongMaterial({
    color:0xe0e8ee, specular:0xfafafa, shininess:140,
    transparent:true, opacity:0.55, side:THREE.DoubleSide
  });

  /* 1) 본체 5면 hollow + 3단 글래스 선반 */
  var pt = 0.018;
  var pof = openDir * pt/2;
  B(wW,        wH,        pt,        mInner, wcx,         wcy,            zBack + pof);   // 후판
  B(wW-pt*2,   pt,        wD-pt,     mInner, wcx,         FT+wH-pt/2,     wcz + pof);     // 상판
  B(wW-pt*2,   pt,        wD-pt,     mInner, wcx,         FT+pt/2,        wcz + pof);     // 하판
  B(pt,        wH-pt*2,   wD-pt,     mInner, wxL+pt/2,    wcy,            wcz + pof);     // 좌측판
  B(pt,        wH-pt*2,   wD-pt,     mInner, wxR-pt/2,    wcy,            wcz + pof);     // 우측판
  for (var si = 1; si <= 3; si++){
    var shY = FT + (si / 4) * wH;
    B(wW-pt*2-0.005, 0.010, wD-pt-0.020, mShelf, wcx, shY, wcz + pof);
  }

  /* 2) 도어 3짝 — L-R-L 패턴 (페어 1+2 + 단일 3) */
  var nDoor = 3;
  var dT    = 0.020;
  var dW    = wW / nDoor;                      // 0.40m (= 가구 67과 동일 도어 폭)
  var dGap  = 0.005;
  var dPanelW = dW - dGap;
  var topTrimH = 0.06;
  var botPlH = 0.025;
  var dH    = wH - topTrimH - botPlH;
  var dCY   = FT + botPlH + dH/2;
  var gY_   = FT + wH - topTrimH - 0.020;

  var hSides = ['left','right','left'];
  for (var di = 0; di < nDoor; di++){
    var dLeft = wxL + di * dW;
    var hSide = hSides[di];
    var hX    = (hSide === 'left') ? dLeft : (dLeft + dW);
    var dlx   = (hSide === 'left') ? dPanelW/2 : -dPanelW/2;
    // openRY 부호: 북측 벽이라 가구 67(남측 -π/2)과 반대
    var oRY   = (hSide === 'left') ? (-openDir * Math.PI/2) : (openDir * Math.PI/2);

    var pivot = new THREE.Object3D();
    pivot.position.set(hX, 0, zFront);
    scene.add(pivot);

    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(dPanelW, dH, dT),
      doorMat
    );
    panel.position.set(dlx, dCY, openDir * dT/2);
    panel.castShadow = true;
    panel.receiveShadow = true;
    pivot.add(panel);

    var groove = new THREE.Mesh(
      new THREE.BoxGeometry(dPanelW * 0.85, 0.008, 0.002),
      grooveMat
    );
    groove.position.set(dlx, gY_, openDir * (dT + 0.001));
    pivot.add(groove);

    _doors.push({pivot:pivot, doorMesh:panel, openRY:oRY, isOpen:false});
  }

  /* 3) 도어 사이 솔기 + 좌·우 끝 솔기 (정적) */
  for (var si2 = 1; si2 < nDoor; si2++){
    var sxC = wxL + dW * si2;
    B(0.003, dH, 0.008, seamMat, sxC, dCY, zFront + openDir * (dT + 0.001));
  }
  B(0.003, dH, 0.008, seamMat, wxL, dCY, zFront + openDir * (dT + 0.001));
  B(0.003, dH, 0.008, seamMat, wxR, dCY, zFront + openDir * (dT + 0.001));

  /* 4) 상단 트림 + 하단 플린스 */
  B(wW, topTrimH, dT + 0.002, trimMat, wcx, FT + wH - topTrimH/2, zFront + openDir * dT/2);
  B(wW, botPlH,   dT + 0.002, plintMat, wcx, FT + botPlH/2,        zFront + openDir * dT/2);
})();

// @FURN#51 주방 하부장(앞), @FURN#52 주방 하부장(우), @FURN#62 주방 상부장(앞)
// ── 주방 가구 (주방식당 z=0 앞벽 + x=7.8 오른쪽 벽, L형) ──────────
// 주방식당: x=5.1~7.8, z=0~4.8
// ① z=0 앞벽 런: x=5.16~7.74, 깊이 z 방향 0.60m
// ② x=7.8 오른쪽 벽 런: z=0.06~2.64(=zM1-WT/2), 깊이 x 방향 0.60m
(function(){
  /* ── 재질 ────────────────────────────────────────────────────── */
  var mLow = new THREE.MeshLambertMaterial({color:0x80807a}); // 하부장 중간 그레이
  var mCnt = new THREE.MeshLambertMaterial({color:0xedecea}); // 카운터탑 화이트쿼츠
  var mUpp = new THREE.MeshLambertMaterial({color:0xd1cfc9}); // 상부장 포그그레이
  var mBsp = new THREE.MeshLambertMaterial({color:0xc5c3bd}); // 백스플래시
  var mSnk = new THREE.MeshLambertMaterial({color:0x9a9a98}); // 싱크볼
  var mFct = new THREE.MeshPhongMaterial({color:0xb2b2b0,
               specular:0x686868, shininess:90});              // 수전 스테인리스

  /* ── 치수 (m) ───────────────────────────────────────────────── */
  var DL=0.60, DU=0.32;   // 하부장/상부장 깊이
  var HL=0.85, HC=0.04;   // 하부장 높이 / 카운터 두께
  var CY = FT+HL+HC;      // 카운터 상면 ≈ 0.94 m
  var UB = 1.55;           // 상부장 하단 높이
  var UH = CH - UB;        // 상부장 높이 = 0.85 m

  /* ── 좌표 기준 ──────────────────────────────────────────────── */
  // 기둥(14번, x=4.90~5.30) 동면 + 카운터탑 좌측 돌출 2cm 고려해 x1=5.34
  var x1=5.34, x2=xBR-WT/2;  // 5.34 , 7.74 (기둥과 클리어런스)
  var zW=WT/2;                      // 0.06  (z=0 벽 내면)
  var xW=xBR-WT/2;                  // 7.74  (x=7.8 벽 내면)

  /* ── 캐비닛 문짝 디테일 헬퍼 ───────────────────────────────── */
  // 전면에 얇은 판을 덧대어 문 구분선·틀 표현
  var mDoor = new THREE.MeshLambertMaterial({color:0x888884});
  function doors(nX, nZ, x, y, z, totalW, totalH, totalD, facingZ){
    // nX×nZ 개 문짝, facingZ=true → z 방향이 면(앞면)
    var gapX=0.012, gapZ=0.012;
    var pW=(totalW-(nX+1)*gapX)/nX;
    var pH=(totalH-gapZ*2)*0.92;
    var fOff=totalD/2+0.006; // 앞면 돌출 거리
    for(var xi=0;xi<nX;xi++){
      var px = x - totalW/2 + gapX*(xi+1) + pW*(xi+0.5);
      var pz = facingZ ? z - fOff : z;
      var pxPos = facingZ ? px : x - fOff;
      if(facingZ){
        B(pW, pH, 0.010, mDoor, px, y, z-totalD/2-0.005);
      } else {
        B(0.010, pH, pW, mDoor, x-totalD/2-0.005, y, px);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     ① z=0 앞벽 런   x=5.34~7.74  (폭 2.40m)
  ══════════════════════════════════════════════════════════════ */
  var W1=x2-x1, cx1=(x1+x2)/2, cz1=zW+DL/2; // 2.40, 6.54, 0.36

  /* ── 30번 하부장 본체 — 5면 중공 (전면 +z 개방) ─────────────── */
  {
    var pt = 0.018;
    var z1B = zW, z2B = zW+DL;            // 0.06, 0.66 (back, front)
    var y1B = FT, y2B = FT+HL;            // 0.05, 0.90
    var yCB = (y1B+y2B)/2, zCB = (z1B+z2B)/2;
    B(W1,        HL,         pt,    mLow, cx1,         yCB,         z1B+pt/2);  // 후판 (z=z1)
    B(W1-pt*2,   pt,         DL-pt, mLow, cx1,         y2B-pt/2,    zCB+pt/2);  // 상판
    B(W1-pt*2,   pt,         DL-pt, mLow, cx1,         y1B+pt/2,    zCB+pt/2);  // 하판
    B(pt,        HL-pt*2,    DL-pt, mLow, x1+pt/2,     yCB,         zCB+pt/2);  // 좌측판
    B(pt,        HL-pt*2,    DL-pt, mLow, x2-pt/2,     yCB,         zCB+pt/2);  // 우측판
  }

  /* ── 30번 하부장 도어 — 5짝 (각 0.48m, 1배 크기) ──────────────────
     L-R-L-R-L 힌지 패턴: (1,2)와 (3,4)가 마주보는 모양(미러 페어)으로 열림.
     냉장고/신발장 양문형과 동일 스타일. 도어 5는 단일(우측 끝).
     인접한 페어 경계에서 힌지 위치(x=6.30, x=7.26)가 공유되어 두 도어가 동시
     개방 시 시각 겹침 발생 가능 — 통상 한 번에 한쪽만 열기에 허용 가능.
  ─────────────────────────────────────────────────────────────────── */
  {
    var DT30   = 0.013;
    var nDr30  = 5;
    var dW30   = W1 / nDr30;               // 0.48 m (= 2.40 / 5)
    var dHt30  = HL * 0.88;
    var dCY30  = FT + HL*0.06 + dHt30/2;
    var dFZ30  = zW + DL;                   // 캐비닛 전면 z = 0.66
    // 힌지 패턴: L, R, L, R, L (i=0..4)
    var hSides30 = ['left','right','left','right','left'];
    for (var i30 = 0; i30 < nDr30; i30++){
      var dLeft = x1 + i30 * dW30;
      var hSide = hSides30[i30];
      var hX    = (hSide === 'left') ? dLeft : (dLeft + dW30);
      var dlx   = (hSide === 'left') ? dW30/2 : -dW30/2;
      var oRY   = (hSide === 'left') ? -Math.PI/2 : Math.PI/2;
      var piv = new THREE.Object3D();
      piv.position.set(hX, 0, dFZ30);
      scene.add(piv);
      var pnl = new THREE.Mesh(new THREE.BoxGeometry(dW30, dHt30, DT30), mDoor);
      pnl.position.set(dlx, dCY30, DT30/2);
      pnl.castShadow = true;
      piv.add(pnl);
      _doors.push({pivot:piv, doorMesh:pnl, openRY:oRY, isOpen:false});
    }
  }

  // 카운터탑 (앞·좌우 2cm 돌출)
  B(W1+0.04, HC, DL+0.04, mCnt, cx1, FT+HL+HC/2, cz1-0.01);
  // 백스플래시 (카운터 상면 ~ 상부장 하단)
  B(W1, UB-CY, 0.008, mBsp, cx1, (CY+UB)/2, zW+0.004);
  // 상부장 본체
  B(W1, UH, DU, mUpp, cx1, UB+UH/2, zW+DU/2);
  // 상부장 문짝 (4짝)
  B(W1, UH*0.90, 0.010, mDoor, cx1, UB+UH*0.05+UH*0.90/2, zW+DU+0.005);

  /* ══════════════════════════════════════════════════════════════
     ② x=7.8 오른쪽 벽 런   z=0.66~2.64  (길이 1.98m)
     (z=0 런의 하부장 깊이(0.60m) 뒤부터 시작 → 코너 중복 방지)
  ══════════════════════════════════════════════════════════════ */
  var zRS=zW+DL, zRE=zM1-WT/2;         // 0.66, 2.64
  var L2=zRE-zRS, cz2=(zRS+zRE)/2;     // 1.98, 1.65
  var cx2=xW-DL/2;                      // 7.44

  /* ── 31번 하부장 본체 — 5면 중공 (전면 -x 개방) ───────────────── */
  {
    var pt = 0.018;
    var x1B = xW-DL, x2B = xW;            // 7.14, 7.74 (front, back)
    var y1B = FT, y2B = FT+HL;
    var z1B = zRS, z2B = zRE;              // 0.66, 2.64
    var xCB = (x1B+x2B)/2, yCB = (y1B+y2B)/2;
    B(pt,         HL,         L2,    mLow, x2B-pt/2,    yCB,         cz2);       // 후판 (x=x2)
    B(DL-pt,      pt,         L2-pt*2,mLow, xCB-pt/2,    y2B-pt/2,    cz2);      // 상판
    B(DL-pt,      pt,         L2-pt*2,mLow, xCB-pt/2,    y1B+pt/2,    cz2);      // 하판
    B(DL-pt,      HL-pt*2,    pt,    mLow, xCB-pt/2,    yCB,         z1B+pt/2); // 전측판 (z=zRS)
    B(DL-pt,      HL-pt*2,    pt,    mLow, xCB-pt/2,    yCB,         z2B-pt/2); // 후측판 (z=zRE)
  }

  /* ── 31번 우측 하부장 도어 — 4짝 (각 0.495m, ≈1배 크기) ─────────────
     zS-zE-zS-zE 힌지 패턴: (A,B)와 (C,D)가 마주보는 모양(미러 페어).
     인접 페어 경계 z=1.65에서 힌지 공유 → 동시 개방 시 시각 겹침 가능.
  ─────────────────────────────────────────────────────────────────── */
  {
    var DT31  = 0.013;
    var nDr31 = 4;
    var dL31  = L2 / nDr31;                 // 0.495 m (= 1.98 / 4)
    var dHt31 = HL * 0.88;
    var dCY31 = FT + HL*0.06 + dHt31/2;
    var dFX31 = xW - DL;                    // 캐비닛 전면 x = 7.14
    // 힌지 패턴: zS, zE, zS, zE (i=0..3)
    var hSides31 = ['zS','zE','zS','zE'];
    for (var i31 = 0; i31 < nDr31; i31++){
      var dFront = zRS + i31 * dL31;        // 도어의 작은 z 끝
      var hSide  = hSides31[i31];
      var hZ     = (hSide === 'zS') ? dFront : (dFront + dL31);
      var dlz    = (hSide === 'zS') ? dL31/2 : -dL31/2;
      var oRY    = (hSide === 'zS') ? -Math.PI/2 : Math.PI/2;
      var piv = new THREE.Object3D();
      piv.position.set(dFX31, 0, hZ);
      scene.add(piv);
      var pnl = new THREE.Mesh(new THREE.BoxGeometry(DT31, dHt31, dL31), mDoor);
      pnl.position.set(-DT31/2, dCY31, dlz);
      pnl.castShadow = true;
      piv.add(pnl);
      _doors.push({pivot:piv, doorMesh:pnl, openRY:oRY, isOpen:false});
    }
  }

  // 코너 카운터탑 연결 (z=0.06~0.66 구간, 하부장 없이 카운터만)
  B(DL+0.04, HC, zRS-zW+0.04, mCnt, cx2+0.01, FT+HL+HC/2, (zW+zRS)/2);
  // 카운터탑 본런 (앞·뒤 2cm 돌출)
  B(DL+0.04, HC, L2+0.04, mCnt, cx2+0.01, FT+HL+HC/2, cz2);
  // 백스플래시
  B(0.008, UB-CY, L2, mBsp, xW-0.004, (CY+UB)/2, cz2);
  // 32번(우측 런) 상부장 — 단일 패널 본체/도어는 제거됨 (이전 사용자 요청).
  //   현재는 동일 위치 영역에 @FURN#73 주방 플랩 상부장(우) 가 별도 IIFE 로 빌드됨
  //   (축소판: 2단 + 위로 들어올리는 반투명 플랩 도어). DU=0.30, L=1.20, UH=0.60.

  /* ══════════════════════════════════════════════════════════════
     ③ 싱크볼 + 수전  (오른쪽 런 z≈1.0)
  ══════════════════════════════════════════════════════════════ */
  // 싱크볼: 카운터에 매립, 약간 낮게
  B(0.48, 0.08, 0.40, mSnk, cx2, FT+HL-0.04, 1.00);

  // 수전 (3단 조립: 베이스→수직 넥→수평 출수구)
  var fY0=FT+HL+HC;            // 카운터 상면
  var fX=cx2-0.06, fZ=0.78;    // 싱크 뒤쪽(벽 방향)
  var yAxis=new THREE.Vector3(0,1,0);
  var zAxis=new THREE.Vector3(0,0,1);

  function faucetCyl(r,h,axis,x,y,z){
    var g=new THREE.CylinderGeometry(r,r,h,10);
    var m=new THREE.Mesh(g, mFct);
    m.quaternion.setFromUnitVectors(yAxis, axis.clone().normalize());
    m.position.set(x,y,z);
    m.castShadow=true;
    scene.add(m);
  }
  faucetCyl(0.022, 0.055, yAxis,        fX,         fY0+0.028,       fZ);  // 베이스
  faucetCyl(0.012, 0.190, yAxis,        fX,         fY0+0.055+0.095, fZ);  // 수직 넥
  faucetCyl(0.009, 0.120, zAxis,        fX,         fY0+0.245,       fZ-0.060); // 출수구
  // 출수구 끝 구형 캡
  var cap=new THREE.Mesh(new THREE.SphereGeometry(0.011,8,6), mFct);
  cap.position.set(fX, fY0+0.245, fZ-0.120);
  scene.add(cap);
})();

// @FURN#73 주방 플랩 상부장(우)
// ── 우측 벽(x=7.8 = 벽 90 라인) 상부장 — 2단, 위로 들어올리는 반투명 플랩 도어 ─────
//    축소판 컴팩트 사이즈 + 반투명 도어 (사용자 요청).
//    위치 변경 이력:
//      v1 원본: y=1.55~2.40 (UH=0.85), 천장 부착, 불투명.
//      v2 축소: y=1.80~2.40 (UH=0.60), 천장 부착, 반투명.
//      v3 현재: y=1.50~2.10 (UH=0.60), 천장에서 30 cm 아래로 이동 (사용자 요청).
//    축소 치수: x=7.44~7.74 (DU=0.30), z=1.05~2.25 (L=1.20), y=1.50~2.10 (UH=0.60).
//    중앙 정렬 (zC=1.65 유지) — 앞벽 5분할 하부장(@FURN#51 z=0.06~0.66) / 우벽 4분할
//    하부장(@FURN#52 z=0.66~2.64) 위쪽에 떠 있음.
//    단 분할: 하단(y=1.50~1.80) + 상단(y=1.80~2.10), 각 단 0.30 m.
//    플랩 도어: 각 단 상단(y=midY 또는 topY)에 z 축 힌지, openR=-π/2 (위로 90° 들어올림).
//    도어 머티리얼: MeshLambertMaterial transparent:true opacity:0.45 — 글래스-프론트 캐비닛 느낌.
//    `_doors[]` 등록 시 `axis:'z'` 로 플래그 → 애니메이션 루프가 z 축 회전 사용.
defineFurniture({
  id:73,
  name:'주방 플랩 상부장(우)',
  room:'주방·식당',
  pos:{cx:7.59, cz:1.65},
  size:{W:0.30, D:1.20, H:0.60},
  bbox:[7.44, 1.05, 7.74, 2.25, 1.50, 2.10]
}, function(spec){
  var mUpp   = new THREE.MeshLambertMaterial({color:0xd1cfc9}); // 포그그레이 (앞면 상부장과 통일)
  var mInner = new THREE.MeshLambertMaterial({color:0xe8e6e1}); // 내부 라이닝 (살짝 밝게)
  // 반투명 도어 (사용자 요청) — 글래스-프론트 캐비닛 스타일.
  // opacity 0.45 / DoubleSide → 캐비닛 내부가 비쳐 보이고, 도어가 위로 열렸을 때도 양면 가시.
  var mDoor  = new THREE.MeshLambertMaterial({
    color:0xc8d4d8,         // 청회색 frosted glass 톤
    transparent:true,
    opacity:0.45,
    side:THREE.DoubleSide
  });

  /* 좌표/치수 — 모두 m */
  var DU    = 0.30;                // 깊이 (=spec.size.W) — 축소
  var UB    = 1.50;                // 하단 y — 천장에서 30 cm 아래
  var topY  = 2.10;                // 상단 y (이전 CT=CH 였으나 이제 천장에서 떨어짐)
  var UH    = topY - UB;           // 전체 높이 0.60
  var x1    = xBR - WT/2 - DU;     // 7.44 (앞면 — 부엌 안쪽)
  var x2    = xBR - WT/2;          // 7.74 (뒷면 — 벽 내면)
  var xC    = (x1+x2)/2;           // 7.59
  var zC    = 1.65;                // 중앙 (이전 위치 유지)
  var L     = 1.20;                // 길이 — 축소
  var zS    = zC - L/2;            // 1.05
  var zE    = zC + L/2;            // 2.25

  var pt    = 0.018;               // 외피 패널 두께
  var midY  = UB + UH/2;           // 1.80 — 단 분리 높이

  /* 1) 외피 5면 hollow + 중간 칸막이 (전면 -x 개방) */
  B(pt,        UH,         L,         mInner, x2-pt/2, midY,       zC);          // 후판 (벽 측)
  B(DU-pt,     pt,         L-pt*2,    mInner, xC-pt/2, topY-pt/2,  zC);          // 상판
  B(DU-pt,     pt,         L-pt*2,    mInner, xC-pt/2, UB+pt/2,    zC);          // 하판
  B(DU-pt,     UH-pt*2,    pt,        mUpp,   xC-pt/2, midY,       zS+pt/2);     // 좌측판 (z=0.66, 부엌 앞쪽)
  B(DU-pt,     UH-pt*2,    pt,        mUpp,   xC-pt/2, midY,       zE-pt/2);     // 우측판 (z=2.64, 침실1 쪽)
  B(DU-pt*2,   pt,         L-pt*2,    mInner, xC,      midY,       zC);          // 중간 칸막이

  /* 2) 플랩 도어 — 2단, 각 단 상단 (z 축) 힌지 */
  //    힌지 축 방향: 벽 90 (x=7.8) 의 길이 방향 = z 축. 도어 닫힘 = 수직, 열림 = 수평.
  //    z 회전 -π/2: 도어 하단(local -y)이 -x (부엌 안쪽) 방향으로 회전 → 천장과 평행.
  var DT   = 0.013;                  // 도어 두께
  var dGap = 0.012;                  // 단 사이/끝 간격
  var dL   = L - dGap*2;             // 도어 길이 = 1.956
  var dH   = (UH/2) - dGap*2;        // 도어 높이 = 0.401 (각 단)

  for (var ti = 0; ti < 2; ti++){
    // ti=0 (하단): 힌지 y = midY, ti=1 (상단): 힌지 y = topY
    var hingeY = (ti === 0) ? midY : topY;
    var pivot  = new THREE.Object3D();
    pivot.position.set(x1, hingeY, zC);     // 도어 힌지 (전면 상단 모서리)
    scene.add(pivot);

    // 도어 패널 — 피벗 약간 아래·앞으로 매달림
    //   로컬 (-DT/2, -dH/2-dGap, 0): 닫힘 시 패널 전면이 캐비닛 전면(x=7.42)에서 살짝 돌출.
    var panel = new THREE.Mesh(new THREE.BoxGeometry(DT, dH, dL), mDoor);
    panel.position.set(-DT/2, -dH/2 - dGap, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    pivot.add(panel);

    // 도어 상단 그루브 (푸시오픈 표현, 부엌에서 보이는 면)
    var groove = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.008, dL*0.85),
      new THREE.MeshLambertMaterial({color:0x404040})
    );
    groove.position.set(-DT - 0.001, -dGap - 0.020, 0);
    pivot.add(groove);

    _doors.push({pivot:pivot, doorMesh:panel, axis:'z', openR:-Math.PI/2, isOpen:false});
  }
});

// @FURN#53 욕실 변기
// ── 욕실 변기 (원피스 일체형, 뒷벽 좌측) ────────────────────────────
// 욕실: x=5.1~7.8, z=4.8~6.6
// 뒷벽(z=6.6) 내면에 탱크 밀착, x=5.38(좌측)
(function(){
  /* 재질 */
  var mCer = new THREE.MeshPhongMaterial({
    color:0xf5f5f5, specular:0x2a2a2a, shininess:68
  });
  var mLid = new THREE.MeshPhongMaterial({
    color:0xeeeeee, specular:0x181818, shininess:32
  });
  var mBtn = new THREE.MeshPhongMaterial({
    color:0xb2bec8, specular:0x909090, shininess:120
  });

  /* 좌표 */
  var zBW  = zB  - WT/2;                // 6.54  뒷벽 내면
  var jen  = 0.15;                      // 젠다이 깊이 (벽 55에서 -z 방향으로 돌출)
  var tx   = xKit + WT/2 + 0.385;       // ≈5.545  x 중심 (좌측 벽 내면에서 20cm 이격)
  var tkD  = 0.185;                      // 탱크 깊이
  var bD   = 0.46;                       // 볼 총 깊이(앞뒤)
  var tkCZ = zBW - jen - tkD/2;         // ≈6.298  탱크 중심 z (젠다이 앞면 기준)
  var bCZ  = tkCZ - tkD/2 - bD/2;      // ≈5.975  볼  중심 z

  /* 원통 헬퍼 (CylinderGeometry + scale) */
  function cyl(rT,rB,h,seg, x,y,z, sx,sy,sz){
    var g  = new THREE.CylinderGeometry(rT,rB,h,seg);
    var m  = new THREE.Mesh(g, mCer);
    m.scale.set(sx||1, sy||1, sz||1);
    m.position.set(x,y,z);
    m.castShadow=true; m.receiveShadow=true;
    scene.add(m); return m;
  }

  /* ① 베이스 발 — 넓적한 타원, 바닥 접지 */
  cyl(0.17,0.19, 0.060, 24,  tx, FT+0.030, bCZ,   1,1, 1.65);

  /* ② 볼 하단 — 밑이 넓고 위로 갈수록 좁아지는 사다리꼴 */
  cyl(0.148,0.185, 0.230, 24,  tx, FT+0.060+0.115, bCZ,  1,1, 1.52);

  /* ③ 볼 상단 / 림 — 다시 살짝 벌어지며 상단 가장자리 형성 */
  cyl(0.175,0.148, 0.105, 24,  tx, FT+0.060+0.230+0.053, bCZ,  1,1, 1.37);

  /* ④ 좌석 링 (토러스, 납작 타원) */
  var gSeat = new THREE.TorusGeometry(0.136, 0.027, 8, 32);
  var mSeat = new THREE.Mesh(gSeat, mLid);
  mSeat.rotation.x = Math.PI/2;
  mSeat.scale.set(1.00, 0.66, 1.28);
  mSeat.position.set(tx, FT+0.350, bCZ);
  mSeat.castShadow=true; scene.add(mSeat);

  /* ⑤ 뚜껑 — 납작한 타원 디스크 */
  var gLid = new THREE.CylinderGeometry(0.180,0.180, 0.022, 28);
  var mLidM = new THREE.Mesh(gLid, mLid);
  mLidM.scale.set(1, 1, 1.36);
  mLidM.position.set(tx, FT+0.350+0.027+0.011, bCZ);
  mLidM.castShadow=true; scene.add(mLidM);

  /* ⑥ 탱크-볼 연결 목(neck) — 매끄러운 전이부 */
  var nkCZ = tkCZ - tkD/2 - 0.060;   // 탱크 앞면에서 60mm 앞
  cyl(0.088,0.115, 0.080, 16,  tx, FT+0.395, nkCZ,  1,1, 1.22);

  /* ⑦ 탱크 본체 */
  var tkBotY = FT + 0.360;
  var tkH    = 0.360;                  // 0.36~0.72 m
  B(0.365, tkH, tkD, mCer,  tx, tkBotY + tkH/2, tkCZ);

  /* ⑧ 탱크 뚜껑 (1.8cm 돌출) */
  B(0.382, 0.024, tkD+0.018, mCer,  tx, tkBotY+tkH+0.012, tkCZ);

  /* ⑨ 플러시 버튼 */
  var gBtn = new THREE.CylinderGeometry(0.022,0.022, 0.013, 12);
  var mBtnM = new THREE.Mesh(gBtn, mBtn);
  mBtnM.position.set(tx, tkBotY+tkH+0.024+0.007, tkCZ);
  mBtnM.castShadow=true; scene.add(mBtnM);
})();

// @FURN#54 욕실 세면대
// ── 욕실 세면대 (스퀘어 월행 타입, 변기 우측) ───────────────────────
// 참고 이미지: 사다리꼴 외형, 단레버 크롬 수전, 오버플로우 없는 깨끗한 디자인
(function(){
  /* 재질 */
  var mCer = new THREE.MeshPhongMaterial({
    color:0xf5f5f5, specular:0x303030, shininess:72
  });
  var mMet = new THREE.MeshPhongMaterial({
    color:0xc4ccce, specular:0x909090, shininess:145
  });
  var mDrn = new THREE.MeshPhongMaterial({
    color:0x888888, specular:0x606060, shininess:85
  });

  /* 치수 */
  var sW    = 0.500;           // 폭 (x)
  var sD    = 0.380;           // 깊이 (z)
  var sBotY = FT + 0.450;     // 세면대 하단 y ≈ 0.50
  var sTopY = FT + 0.840;     // 세면대 상단(림) y ≈ 0.89
  var sH    = sTopY - sBotY;  // = 0.390
  var halfH = sH / 2;          // = 0.195

  /* 위치
     변기 중심 x=5.545, 볼 x반경 0.185 → 변기 오른쪽 끝 ≈5.730
     변기 쪽으로 15cm 이동 → 중심 x=6.030 (세면대 왼쪽 끝 5.780, 변기와 5cm 간격) */
  var sx   = 6.030;
  var zBW  = zB - WT/2;        // 6.54  뒷벽 내면
  var jen  = 0.15;              // 젠다이 깊이 (벽 55에서 -z 방향)
  var szCZ = zBW - jen - sD/2; // ≈6.20  세면대 z 중심 (젠다이 앞면 기준)

  /* ① 하단부 — 사다리꼴 좁은 아랫면 */
  B(sW * 0.68, halfH, sD * 0.72, mCer,
    sx, sBotY + halfH/2, szCZ);

  /* ② 상단부 — 넓은 basin 몸통 */
  B(sW, halfH, sD, mCer,
    sx, sBotY + halfH + halfH/2, szCZ);

  /* ③ 상판 림 (1cm 돌출, 2cm 두께) */
  B(sW + 0.012, 0.020, sD + 0.012, mCer,
    sx, sTopY + 0.010, szCZ);

  /* ④ 단레버 크롬 수전 */
  var yA  = new THREE.Vector3(0,1,0);
  var xA  = new THREE.Vector3(1,0,0);
  var nzA = new THREE.Vector3(0,0,-1);   // 스파우트 방향 (전면쪽)
  var fX  = sx;
  var fZb = szCZ + sD * 0.27;            // 수전 z (뒤쪽 배치)
  var fY0 = sTopY + 0.020;               // 베이스 바닥 y

  function fCyl(r,h,ax,x,y,z){
    var g=new THREE.CylinderGeometry(r,r,h,12);
    var m=new THREE.Mesh(g,mMet);
    m.quaternion.setFromUnitVectors(yA, ax.clone().normalize());
    m.position.set(x,y,z);
    m.castShadow=true; scene.add(m);
  }
  fCyl(0.019,0.034, yA,  fX, fY0+0.017,            fZb);         // 베이스 원판
  fCyl(0.010,0.150, yA,  fX, fY0+0.034+0.075,       fZb);         // 수직 바디
  fCyl(0.007,0.085, xA,  fX, fY0+0.034+0.150+0.010, fZb);         // 레버 핸들
  fCyl(0.007,0.095, nzA, fX, fY0+0.175,              fZb-0.048);  // 스파우트

  var cap=new THREE.Mesh(new THREE.SphereGeometry(0.009,8,6),mMet);
  cap.position.set(fX, fY0+0.175, fZb-0.095);
  cap.castShadow=true; scene.add(cap);

  /* ⑤ 배수구 (은색 원판) */
  var gDrn=new THREE.CylinderGeometry(0.016,0.016,0.006,12);
  var mDrnM=new THREE.Mesh(gDrn,mDrn);
  mDrnM.position.set(sx, sTopY+0.001, szCZ);
  scene.add(mDrnM);
})();

// @FURN#55 샤워 파티션
// ── 욕실 샤워 파티션 (솔리드 하단 + 유리 상단, 세면대 우측) ─────────
// 세면대 신위치 sx=6.030, 오른쪽 끝 ≈6.280 / 파티션 x=6.55 (세면대 쪽 -0.15)
// z 범위: 뒷벽(6.54) ~ 5.46 (앞쪽 0.60m 개구부로 샤워 진입)
(function(){
  /* 재질 */
  var mPtl = new THREE.MeshLambertMaterial({color:0xccc8be}); // 솔리드 벽 (회색 타일)
  var mGls = new THREE.MeshLambertMaterial({
    color:0xb8d4de, transparent:true, opacity:0.26, side:THREE.DoubleSide
  });
  var mFrm = new THREE.MeshPhongMaterial({
    color:0xb2b6b8, specular:0x686868, shininess:95
  });

  /* 파티션 치수 */
  var px   = 6.55;             // 파티션 x 중심 (29번 세면대 쪽 -0.15m 이동)
  var solW = 0.10;             // 솔리드 하단 두께
  var glsW = 0.010;            // 유리 두께
  var frmW = 0.040;            // 프레임 단면 폭

  var pZ1  = 5.46;             // 파티션 앞쪽 끝 z  (전면벽 내면 4.86 → 개구부 0.60m)
  var pZ2  = zB - WT/2;        // 파티션 뒷쪽 끝 z  (뒷벽 내면 ≈6.54)
  var pL   = pZ2 - pZ1;        // 파티션 길이 ≈1.08m
  var pCZ  = (pZ1 + pZ2) / 2;  // z 중심 ≈6.00

  var solH = 1.06;              // 솔리드 하단 높이
  var glsH = CH - solH - 0.04; // 유리 높이 (천장 4cm 아래까지)

  /* ① 하단 솔리드 벽 */
  B(solW, solH, pL, mPtl,
    px, FT + solH/2, pCZ);

  /* ② 상단 유리 패널 */
  B(glsW, glsH, pL, mGls,
    px, solH + glsH/2, pCZ);

  /* ③ 알루미늄 프레임
       · 하단 수평: 솔리드 상단 ~ 유리 하단 접합
       · 상단 수평: 유리 상단
       · 앞쪽 수직: 유리 앞면 엣지
       · 상하 수직 마감: 솔리드 앞쪽 코너 */
  // 하단 수평
  B(frmW, 0.013, pL, mFrm,
    px, solH + 0.007, pCZ);
  // 상단 수평
  B(frmW, 0.013, pL, mFrm,
    px, solH + glsH - 0.007, pCZ);
  // 앞쪽 수직 (유리 구간)
  B(frmW, glsH, 0.013, mFrm,
    px, solH + glsH/2, pZ1);
  // 솔리드 앞면 수직 코너 마감
  B(frmW, solH, 0.013, mFrm,
    px, FT + solH/2, pZ1);
})();

// ── 욕실 샤워기 (벽 80 = 욕실 뒷벽 z=6.6, 샤워 스톨 내부) ──────────
// 위치: 샤워 스톨(x=6.60~7.30, z=5.46~6.54) 백월에 마운트
// 형태: 레인 샤워 스타일 — 벽 플랜지 + 가로 암 + 90° 엘보 + 헤드 (하향)
(function(){
  var sx    = 6.95;                          // 샤워 스톨 x 중앙
  var wallZ = zB - WT/2;                     // 6.54  (벽 80 내면)
  var mountY = 2.00;                          // 헤드 마운트 높이 (젠다이 1.11 위)

  /* 재질 */
  var mChrome   = new THREE.MeshPhongMaterial({color:0xcacace, specular:0xeaeaee, shininess:180});
  var mHead     = new THREE.MeshPhongMaterial({color:0xb8b8bc, specular:0xd0d0d4, shininess:130});
  var mHeadFace = new THREE.MeshLambertMaterial({color:0x303034});  // 헤드 하면(홀 패턴)

  /* 1) 벽 플랜지 (마운트 디스크) */
  var flange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.014, 16),
    mChrome
  );
  flange.rotation.x = Math.PI/2;             // 축 z 방향
  flange.position.set(sx, mountY, wallZ - 0.007);
  flange.castShadow = true;
  scene.add(flange);

  /* 2) 가로 암 (벽에서 -z 방향으로 25cm 뻗음) */
  var armL = 0.25;
  var armZ = wallZ - 0.014 - armL/2;          // 6.40 (암 중심)
  var arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, armL, 12),
    mChrome
  );
  arm.rotation.x = Math.PI/2;
  arm.position.set(sx, mountY, armZ);
  arm.castShadow = true;
  scene.add(arm);

  /* 3) 암 끝 엘보 (하향 꺾임부) */
  var elbowZ = wallZ - 0.014 - armL;          // 6.276
  var elbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.020, 12, 8),
    mChrome
  );
  elbow.position.set(sx, mountY, elbowZ);
  scene.add(elbow);

  /* 4) 짧은 하향 파이프 (엘보 → 헤드) */
  var dropL = 0.045;
  var drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, dropL, 12),
    mChrome
  );
  drop.position.set(sx, mountY - dropL/2, elbowZ);
  scene.add(drop);

  /* 5) 샤워 헤드 (레인 샤워 스타일, 큰 원형 디스크) */
  var headR = 0.090;                          // 18cm 직경
  var headT = 0.025;                          // 두께
  var headY = mountY - dropL - headT/2;       // 1.94 (중심 y)
  var head = new THREE.Mesh(
    new THREE.CylinderGeometry(headR, headR, headT, 28),
    mHead
  );
  head.position.set(sx, headY, elbowZ);
  head.castShadow = true;
  scene.add(head);

  /* 6) 헤드 하면 (홀 패턴 표현, 어두운 디스크) */
  var headFace = new THREE.Mesh(
    new THREE.CylinderGeometry(headR - 0.005, headR - 0.005, 0.003, 28),
    mHeadFace
  );
  headFace.position.set(sx, headY - headT/2 - 0.0015, elbowZ);
  scene.add(headFace);
})();

// ── 욕실 젠다이 (벽 80 = 욕실 뒷벽 z=6.6, 좌측 벽~벽 107까지 2단) ─────
// 높이: 샤워 파티션 솔리드 높이 1.06m, 깊이: 15cm
// 세그먼트 1: 좌측 벽~샤워 파티션 좌면 (x=5.16~6.50)
// 세그먼트 2: 샤워 파티션 우면~벽 107 (x=6.60~7.24, 샤워 스톨 안 백월)
// 두 세그먼트 사이는 샤워 파티션 솔리드(x=6.50~6.60)가 자연 차단
(function(){
  var mZen  = new THREE.MeshLambertMaterial({color:0xccc8be}); // 샤워 파티션과 동일 톤
  var mZTop = new THREE.MeshLambertMaterial({color:0xedecea}); // 상판: 카운터탑 화이트
  var jH = 1.06;                       // 젠다이 본체 높이 (샤워 파티션 솔리드와 동일)
  var jD = 0.15;                       // 젠다이 깊이 (z 방향 돌출)
  var zBW = zB - WT/2;                 // 6.54  뒷벽 내면
  var jZ1 = zBW - jD;                  // 6.39  젠다이 앞면
  var jZ2 = zBW;                        // 6.54  젠다이 뒷면 (벽 내면)
  var jCZ = (jZ1 + jZ2) / 2;            // 6.465  z 중심
  var topT = 0.020;                     // 상판 두께 2cm

  // === 세그먼트 1: 좌측 벽 (x=5.16) ~ 샤워 파티션 좌면 (x=6.50) ===
  var s1X1 = xKit + WT/2;               // 5.16
  var s1X2 = 6.55 - 0.10/2;             // 6.50  샤워 파티션 좌면
  var s1W  = s1X2 - s1X1;               // 1.34
  var s1CX = (s1X1 + s1X2) / 2;         // 5.83
  // 본체
  B(s1W, jH - topT, jD, mZen, s1CX, FT + (jH - topT)/2, jCZ);
  // 상판 (앞쪽 1cm 돌출 마감)
  B(s1W, topT, jD + 0.010, mZTop, s1CX, FT + jH - topT/2, jCZ - 0.005);

  // === 세그먼트 2: 샤워 파티션 우면 (x=6.60) ~ 벽 107 (x=7.30) ===
  // 벽 107 (욕실 동쪽 chase 서면)은 x=7.30 면에 직접 인접 — chase는 x=7.30~7.80
  // 솔리드 박스 (line 492 참고)이므로 chase 서면 = x=7.30 면 자체에 붙임
  var s2X1 = 6.55 + 0.10/2;             // 6.60  샤워 파티션 우면
  var s2X2 = 7.30;                       // 7.30  벽 107 (chase 서면)에 직접 부착
  var s2W  = s2X2 - s2X1;               // 0.70
  var s2CX = (s2X1 + s2X2) / 2;         // 6.95
  // 본체
  B(s2W, jH - topT, jD, mZen, s2CX, FT + (jH - topT)/2, jCZ);
  // 상판
  B(s2W, topT, jD + 0.010, mZTop, s2CX, FT + jH - topT/2, jCZ - 0.005);
})();

// @FURN#56 욕실 휴지걸이
// ── 욕실 매립형 휴지걸이 (좌측 벽, 변기 옆) ─────────────────────────
// 욕실 좌측 벽(x=5.1) 내면 = xKit+WT/2 = 5.16
// 변기 볼 z≈6.125에 맞춰 hz=6.05, 높이 hy=FT+0.72
(function(){
  var wallX = xKit + WT/2;     // 5.16  벽 내면
  var hz    = 5.90;             // z 중심 (변기 좌석 앞 영역, 젠다이 -15cm 이동)
  var hy    = FT + 0.720;      // y 중심 (바닥 위 72cm)

  /* 치수 */
  var fW = 0.155;   // 프레임 내부 폭  (z)
  var fH = 0.155;   // 프레임 내부 높이 (y)
  var fD = 0.074;   // 매립 깊이 (x, 벽 두께 WT=0.12 이내)
  var fT = 0.013;   // 프레임 바 두께

  /* 재질 */
  var mSS  = new THREE.MeshPhongMaterial({
    color:0xbec2c4, specular:0x888888, shininess:130
  });
  var mBk  = new THREE.MeshLambertMaterial({color:0x111111});  // 공동 배경 (어두움)
  var mPpr = new THREE.MeshLambertMaterial({color:0xf4f4f1});  // 화장지 흰색
  var mCor = new THREE.MeshLambertMaterial({color:0xd2c28a});  // 심지 베이지

  var cavX = wallX - fD / 2;    // 공동 x 중심 ≈ 5.123
  var ex   = wallX - fT / 2;    // 프레임 x (벽면에 얇게 노출)

  /* ① 공동 배경 */
  B(fD, fH - fT*2, fW - fT*2, mBk, cavX, hy, hz);

  /* ② 스테인리스 프레임 (4변 테두리) */
  B(fT, fT, fW + fT*2, mSS, ex, hy + fH/2,  hz);        // 상단 수평
  B(fT, fT, fW + fT*2, mSS, ex, hy - fH/2,  hz);        // 하단 수평
  B(fT, fH, fT,        mSS, ex, hy, hz - fW/2);          // 좌측 수직
  B(fT, fH, fT,        mSS, ex, hy, hz + fW/2);          // 우측 수직

  /* ③ 화장지 롤 (z축 방향 수평 배치) */
  var rollR = 0.044;
  var rollL = 0.106;
  var rollX = wallX - fD * 0.65;   // ≈5.112

  var gRoll = new THREE.CylinderGeometry(rollR, rollR, rollL, 20);
  var mRollM = new THREE.Mesh(gRoll, mPpr);
  mRollM.rotation.x = Math.PI / 2;
  mRollM.position.set(rollX, hy, hz);
  mRollM.castShadow = true;
  scene.add(mRollM);

  /* ④ 심지 (베이지 내통) */
  var gCore = new THREE.CylinderGeometry(0.016, 0.016, rollL + 0.004, 12);
  var mCoreM = new THREE.Mesh(gCore, mCor);
  mCoreM.rotation.x = Math.PI / 2;
  mCoreM.position.copy(mRollM.position);
  scene.add(mCoreM);

  /* ⑤ 아치형 상단 가드 (반원통 크롬 커버, 롤 위를 덮음)
     rotation.x = -π/2 → 실린더 축이 z방향
     thetaStart=0, Length=π → theta=0(+X)→π/2(+Y)→π(-X) : 위쪽 아치 ✓  */
  var guardR = rollR + 0.008;
  var gG = new THREE.CylinderGeometry(
    guardR, guardR, rollL + 0.010, 24, 1, true, 0, Math.PI
  );
  var mGM = new THREE.Mesh(gG, mSS);
  mGM.rotation.x = -Math.PI / 2;
  mGM.position.set(rollX, hy, hz);
  mGM.castShadow = true;
  scene.add(mGM);
})();

// @FURN#57 욕실 거울장
// ── 욕실 거울장 (세면대 상부, 뒷벽 벽걸이식) ──────────────────────────
// 세면대 중심 x=6.030 / 세면대 상판 sTopY≈0.89 / 뒷벽 내면 zBW=6.54
// 힌지: 우측(+x=cX+cW/2), openRY=-π/2 → 욕실 안쪽(−z)으로 열림
(function(){
  /* ── 치수 ─────────────────────────────────────────────────────────── */
  var cW    = 0.550;                    // 캐비닛 폭  (x)
  var cH    = 0.900;                    // 캐비닛 높이 (y) — 0.6 → 0.9 (상단 확장 +0.3)
  var cD    = 0.120;                    // 캐비닛 깊이 (z) ≈ WT
  var cX    = 6.030;                    // 중심 x  (세면대와 정렬, 6.18 → 6.03)
  var cBotY = 1.300;                     // 하단 y  = 1.30 (유지)
  var cTopY = cBotY + cH;              // 상단 y  = 2.20 (1.30+0.90)
  var zBWc  = zB - WT / 2;             // 뒷벽 내면 z  = 6.54
  var cFZ   = zBWc - cD;               // 캐비닛 전면 z = 6.42
  var cCZ   = zBWc - cD / 2;           // 캐비닛 중심 z = 6.48

  /* ── 재질 ─────────────────────────────────────────────────────────── */
  var mBody = new THREE.MeshLambertMaterial({color:0xf4f2ef}); // 본체 흰색 래커
  var mInt  = new THREE.MeshLambertMaterial({color:0xe4e1db}); // 내부면 (약간 어두움)
  var mMir  = new THREE.MeshPhongMaterial({                    // 거울 면
    color:0xbcc5ce, specular:0xfafafa, shininess:220, side:THREE.FrontSide
  });
  var mAlm  = new THREE.MeshPhongMaterial({                    // 알루미늄 프레임·손잡이
    color:0xb0b8bc, specular:0x888888, shininess:130
  });

  var PT = 0.018;   // 판재 두께 (상·하·좌·우·후판)

  /* ── ① 캐비닛 본체 (5면 상자, 전면 개방) ──────────────────────────── */
  B(cW,        PT,  cD,  mBody,  cX,                cTopY - PT/2,     cCZ); // 상판
  B(cW,        PT,  cD,  mBody,  cX,                cBotY + PT/2,     cCZ); // 하판
  B(PT,        cH,  cD,  mBody,  cX + cW/2 - PT/2,  cBotY + cH/2,    cCZ); // 우측판 (힌지쪽)
  B(PT,        cH,  cD,  mBody,  cX - cW/2 + PT/2,  cBotY + cH/2,    cCZ); // 좌측판
  B(cW-PT*2, cH-PT*2, PT, mBody, cX,               cBotY + cH/2,  zBWc - PT/2); // 후판

  /* ── ② 내부 선반 2개 ──────────────────────────────────────────────── */
  var shW  = cW - PT*2 - 0.004;    // 선반 폭  (내부 클리어런스 각 2mm)
  var shD  = cD - PT*2 - 0.008;    // 선반 깊이
  var shCZ = zBWc - PT - shD/2;    // 선반 z 중심
  B(shW, PT, shD, mInt,  cX,  cBotY + cH*0.33,  shCZ); // 하단 선반
  B(shW, PT, shD, mInt,  cX,  cBotY + cH*0.67,  shCZ); // 상단 선반

  /* ── ③ 거울 문 (피벗 = 우측 힌지 x=6.455) ──────────────────────────
       로컬 좌표계: 힌지=원점, 문은 로컬 −x 방향으로 cW 연장
       openRY = −π/2 → 자유단이 −z 방향으로 회전 → 욕실 안쪽으로 열림  */
  var dT   = 0.016;           // 문짝 두께
  var pivX = cX + cW/2;       // = 6.455  힌지 x
  var pivZ = cFZ;              // = 6.42   캐비닛 전면 z

  var mirrorPivot = new THREE.Object3D();
  mirrorPivot.position.set(pivX, 0, pivZ);
  scene.add(mirrorPivot);

  /* 피벗-로컬 박스 헬퍼 */
  function mBx(w,h,d,mat,lx,ly,lz){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(lx, ly, lz);
    m.castShadow = true; m.receiveShadow = true;
    mirrorPivot.add(m);
  }

  /* 로컬 기준점 */
  var dCX = -cW/2;            // 문 중심 로컬 x = −0.275
  var dCY = cBotY + cH/2;     // 문 중심 로컬 y =  1.29
  var dCZ = -dT/2;             // 문 중심 로컬 z (전면 방향으로 살짝 이격)

  /* 문 본체 */
  mBx(cW,   cH,   dT,    mBody,  dCX,  dCY,  dCZ);

  /* 거울 면 (전면에 5mm 판 부착) */
  var mirPad = 0.018;
  mBx(cW - mirPad*2,  cH - mirPad*2,  0.005,  mMir,
      dCX,  dCY,  -(dT + 0.003));

  /* 거울 테두리 (알루미늄 4변 프레임) */
  var fB  = 0.008;
  var fW2 = cW - mirPad*2;
  var fH2 = cH - mirPad*2;
  var fZ  = -(dT + 0.006);
  mBx(fW2 + fB*2, fB,        0.004, mAlm, dCX,              dCY + fH2/2 + fB/2, fZ); // 상
  mBx(fW2 + fB*2, fB,        0.004, mAlm, dCX,              dCY - fH2/2 - fB/2, fZ); // 하
  mBx(fB,         fH2+fB*2,  0.004, mAlm, dCX - fW2/2-fB/2, dCY,               fZ); // 좌(자유단)
  mBx(fB,         fH2+fB*2,  0.004, mAlm, dCX + fW2/2+fB/2, dCY,               fZ); // 우(힌지)

  /* 손잡이 — 막대형 풀 핸들 (자유단 쪽 60mm 안쪽) */
  var hX = -(cW - 0.060);   // 로컬 x ≈ −0.490
  var hY = dCY;              // 문 중심 y
  var hZ = -(dT + 0.020);   // 전면에서 20mm 돌출
  mBx(0.012, 0.082, 0.012, mAlm, hX, hY,          hZ);          // 수직 바
  mBx(0.012, 0.010, 0.030, mAlm, hX, hY + 0.036,  hZ + 0.009); // 상단 브라켓
  mBx(0.012, 0.010, 0.030, mAlm, hX, hY - 0.036,  hZ + 0.009); // 하단 브라켓

  /* 레이캐스트용 비가시 패널 */
  var dmesh = new THREE.Mesh(
    new THREE.PlaneGeometry(cW, cH),
    new THREE.MeshBasicMaterial({visible:false, side:THREE.DoubleSide})
  );
  dmesh.position.set(dCX, dCY, 0);
  mirrorPivot.add(dmesh);

  /* _doors[] 등록 */
  _doors.push({pivot:mirrorPivot, doorMesh:dmesh, openRY:-Math.PI/2, isOpen:false});
})();

// @FURN#60 욕실 벽등(상), @FURN#61 욕실 벽등(하)
// ── 욕실 벽등 — 28번 변기 뒤쪽 벽에 세로로 2개 ────────────────────────
//    참고: 첨부 사진의 원형 슬랫 벽등 (흰색 본체 + 글로 디퓨저 + 수직 슬랫)
(function(){
  var mShade = new THREE.MeshLambertMaterial({color:0xf2efe7});  // 본체 (베이지 화이트)
  var mInner = new THREE.MeshPhongMaterial({                       // 글로 디퓨저
    color:0xfff8e0, emissive:0xfff0c0, emissiveIntensity:0.7,
    shininess:80
  });
  var mBar   = new THREE.MeshLambertMaterial({color:0xddd6c5});  // 슬랫

  var lampX = 5.545;             // 28번 변기 중심 x
  var wallZ = zB - WT/2;         // 6.54 — 뒷벽 내면

  function makeLamp(y){
    var R     = 0.092;           // 외경 (직경 18.4cm)
    var depth = 0.080;           // 벽 돌출 8cm
    var diffR = R * 0.78;        // 디퓨저 반경

    /* ① 본체 실린더 (벽 마운트) */
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, depth, 28),
      mShade
    );
    body.rotation.x = Math.PI / 2;
    body.position.set(lampX, y, wallZ - depth/2);
    body.castShadow = true;
    scene.add(body);

    /* ② 전면 디퓨저 (글로 디스크) */
    var diff = new THREE.Mesh(
      new THREE.CylinderGeometry(diffR, diffR, 0.005, 28),
      mInner
    );
    diff.rotation.x = Math.PI / 2;
    diff.position.set(lampX, y, wallZ - depth + 0.0025);
    scene.add(diff);

    /* ③ 전면 외곽 림 (얇은 토러스) */
    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(R*0.92, 0.014, 10, 28),
      mShade
    );
    rim.position.set(lampX, y, wallZ - depth);
    scene.add(rim);

    /* ④ 수직 슬랫 (디퓨저 위 7개 균등) — 디스크 코드 길이는 위치별 차이 */
    var nBars = 7;
    for (var i = 0; i < nBars; i++) {
      var t = (i + 1) / (nBars + 1);
      var dx = (t - 0.5) * 2 * diffR * 0.95;
      var halfChord = Math.sqrt(Math.max(0, diffR*diffR - dx*dx)) - 0.004;
      if (halfChord < 0.005) continue;
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, halfChord*2, 0.005),
        mBar
      );
      bar.position.set(lampX + dx, y, wallZ - depth - 0.001);
      scene.add(bar);
    }

    /* ⑤ 점광원 — 실제 빛 효과 */
    var light = new THREE.PointLight(0xfff0d0, 0.4, 2.2);
    light.position.set(lampX, y, wallZ - depth - 0.05);
    scene.add(light);
  }

  // 거울장 기준 정렬 (cBotY=1.30, cTopY=2.20, 중심=1.75, 램프 R=0.092)
  makeLamp(2.108);  // 40번 — 맨 위쪽이 거울장 맨 위(y=2.20)와 일치
  makeLamp(1.842);  // 41번 — 맨 아래쪽이 거울장 상하 중심선(y=1.75)과 일치
})();

