/* =====================================================================
   MINIMAP  (2D floor-plan overlay, bottom-left)
===================================================================== */
(function() {
  // Layout identical to 3D geometry
  // X : 0 | 1.5 | 5.1 | 7.8 | 10.5 | 12
  // Z : 0 | 2.7 | 4.2 | 6.6
  var W3 = 12, H3 = 6.6;            // apartment size in metres
  var PAD = 12;                      // canvas padding px
  var S   = 40;                      // px per metre  (2× 확대 — 번호 가독성)
  var CW  = W3*S + PAD*2;            // canvas width  = 504
  var CH2 = H3*S + PAD*2;           // canvas height = 288

  var mc  = document.getElementById('minimap');
  mc.width  = CW;
  mc.height = CH2;
  var ctx = mc.getContext('2d');

  // Room definitions  [x1,z1, x2,z2, fill, label, labelX, labelZ]
  // 좌표는 모듈 스코프의 그리드 상수(xL/xBal/xKit/xBR/xHall/xR, zT/zM1/zM2/zBath/zB, zLR2)를 참조.
  // 그리드에 없는 오프-그리드 값(인덴트 0.6, 창고2 깊이 0.9, PD/chase/기둥)만 리터럴.
  // 안정 식별자(@ROOM#NN): 미니맵 글로벌 번호와 일치. LLM 검색 시 정확 매칭용.
  var ROOMS = [
    [xL,    0.9,   xBal,  zLR2, '#c49a50', '',         0.75, 2.2 ],   // @ROOM#1  거실 확장 (창고2 아래로 축소)
    [0.6,   zT,    xBal,  0.9,  '#cdc5ad', '창고2',    1.05, 0.45],   // @ROOM#2  창고2 (좌상단, 66번 벽 이동)
    [xL,    zLR2,  xBal,  zB,   '#cdc5ad', '발코니',   0.75, 5.05],   // @ROOM#3  발코니 아래쪽
    [xBal,  zT,    xKit,  zLR2, '#c49a50', '거실',     3.3,  1.75],   // @ROOM#4  거실 (z=3.5까지 확장)
    [xKit,  zT,    xBR,   zBath,'#c49a50', '주방·식당',6.45, 2.4 ],   // @ROOM#5  주방식당+연결통로1
    [xBR,   zM1,   xHall, zM2,  '#c49a50', '',         9.15, 3.45],   // @ROOM#6  연결통로2 (개방)
    [xBR,   zT,    xHall, zM1,  '#c8a870', '서재',   9.15, 1.35],   // @ROOM#7  서재
    [xHall, zT,    xR,    zM2,  '#cdc5ad', '복도',    11.25, 2.1 ],   // @ROOM#8  복도 (z=0~4.2, 벽 82 이동)
    [xBal,  zLR2,  xKit,  zB,   '#c8a870', '침실 2',   3.3,  5.05],   // @ROOM#9  침실2 (위쪽 벽 z=3.5)
    [xKit,  zBath, xBR,   zB,   '#90bac8', '욕실',     6.45, 5.7 ],   // @ROOM#10 욕실
    [xBR,   zM2,   xHall, zB,   '#cdc5ad', '창고',     9.15, 5.4 ],   // @ROOM#11 창고
    // 배관/PD 음영 박스 — 어두운 회색
    [1.1,   6.2,   xBal,  zB,   '#777777', '',         0,    0   ],   // @ROOM#12 발코니 우하단 PD
    [7.3,   zBath, xBR,   zB,   '#777777', '',         0,    0   ],   // @ROOM#13 욕실 동쪽 chase (서벽 -0.2m)
    [4.90,  zT,    5.30,  0.75, '#777777', '',         0,    0   ],   // @ROOM#14 거실↔주방 배관 기둥
    [9.88,  3.77,  10.44, 4.14, '#777777', '',         0,    0   ],   // @ROOM#15 신발장 옆 기둥
  ];

  // Wall segments [x1,z1, x2,z2]  (drawn as thick strokes)
  // 좌표는 그리드 상수 + zLR2 + 도어 폭 DW(0.9) + 도어 fill 0.10 등 의미가 명확한 식으로 표현.
  var WALLS = [
    // ── outer boundary ────────────────────────────────────────────────
    // 앞면 z=0 — 룸별 분할 (인덴트 x=0~0.4 + 현관문 x=10.8~11.7 갭 반영)
    [0.6,    zT,   xBal,  zT  ],   // 창고2(2번 방) 위쪽 외벽
    [xBal,   zT,   xKit,  zT  ],   // 거실(4번 방) 위쪽 외벽
    [xKit,   zT,   xBR,   zT  ],   // 주방·식당(5번 방) 위쪽 외벽
    [xBR,    zT,   xHall, zT  ],   // 서재(7번 방) 위쪽 외벽
    [xHall,  zT,   10.8,  zT  ],   // 복도(8번 방) 위쪽 외벽 (현관문 좌측)
    [11.7,   zT,   xR,    zT  ],   // 복도(8번 방) 위쪽 외벽 (현관문 우측)
    // 뒷면 z=6.6 — 룸별 분할
    [xL,     zB,   xBal,  zB  ],   // 발코니(3번 방) 아래쪽 외벽
    [xBal,   zB,   xKit,  zB  ],   // 침실2(9번 방) 아래쪽 외벽
    [xKit,   zB,   xBR,   zB  ],   // 욕실(10번 방) 아래쪽 외벽
    [xBR,    zB,   xHall, zB  ],   // 창고(11번 방) 아래쪽 외벽
    [xHall,  zM2,  xR,    zM2 ],   // 복도(8번 방) 아래쪽 외벽 (벽 82, z=6.6 -> 4.2 이동)
    // 좌측 x=0 — 거실확장/발코니 분할 (인덴트 z=0~0.9 제외)
    [xL,     0.9,  xL,    zLR2],   // 거실확장(1번 방) 왼쪽 외벽
    [xL,     zLR2, xL,    zB  ],   // 발코니(3번 방) 왼쪽 외벽
    // 우측 x=12 — 복도 외벽 (단일)
    [xR,     zT,   xR,    zB  ],   // 복도(8번 방) 오른쪽 외벽
    // ── balcony separator x=1.5 (아래쪽만: z=3.5~6.6) ──────────────
    [xBal,   zLR2, xBal,  zB  ],
    // ── x=7.8, z=0–2.7  주방·서재 경계 (문 없음) ──────────────────
    [xBR,    zT,   xBR,   zM1 ],
    // ── x=5.1, z=3.5–6.6  침실2 우측 (문: z=3.5–4.4) ───────────────
    [xKit,   zLR2+DW, xKit, zB],
    // ── x=7.8, z=4.2–6.6  창고 좌측 (문 없음) ───────────────────────
    [xBR,    zM2,  xBR,   zB  ],
    // ── x=10.5, z=0–2.7  복도·서재 (문 없음) ───────────────────────
    [xHall,  zT,   xHall, zM1 ],
    // ── x=10.5, z=2.7–4.2  현관 내부문 (문: 2.85–3.75) ──────────────
    [xHall, zM1, xHall, 2.85], [xHall, 3.75, xHall, zM2],
    // ── x=10.5, z=4.2–6.6  복도·창고 (문 없음) ──────────────────────
    [xHall,  zM2,  xHall, zB  ],
    // ── z=3.5  발코니 분리벽 (문: x=0.3~1.2) + 침실2 상단 (봉인) ────
    [xL,     zLR2, 0.3,   zLR2],   // 발코니 분리벽 왼쪽
    [1.2,    zLR2, xKit,  zLR2],   // 발코니 분리벽 오른쪽 + 침실2 상단 (gap x=0.3~1.2)
    // ── z=2.7, x=7.8–10.5  서재 아래쪽 왼쪽 문 (x=7.8–8.7) ─────────
    [xBR+DW, zM1,  xHall, zM1 ],
    // (문 구간 x=7.8–8.7 은 gap)
    // ── z=4.2, x=7.8–10.5  창고 위쪽 왼쪽 문 (x=7.8–8.7) ─────────────
    [xBR+DW, zM2,  xHall, zM2 ],
    // (문 구간 x=7.8–8.7 은 gap; 서재 아래 문과 마주봄)
    // ── z=4.8, x=5.1–7.8  욕실 상단 (문: 5.4–6.2) ───────────────────
    [xKit, zBath, 5.4, zBath], [6.2, zBath, xBR, zBath],
    // ── 창고2 (66번 벽 +0.2m 이동): 남벽 (문: x=0.7–1.4), 동벽 x=1.5, 서벽 x=0.6 ─
    [0.6, 0.9, 0.7, 0.9], [1.4, 0.9, xBal, 0.9],   // 남벽 좌/우 솔리드
    [xBal, zT, xBal, 0.9],                          // 동벽
    [xL, 0.9, 0.6, 0.9],                            // 인덴트 남쪽 외벽
    [0.6, zT, 0.6, 0.9],                            // 인덴트 서쪽 외벽 (66번 벽)
    // ── 발코니 우하단 PD: z=6.2 북면, x=1.1 서면 ─────────────────────
    [1.1, 6.2, xBal, 6.2],
    [1.1, 6.2, 1.1, zB],
    // ── 욕실 동쪽 chase 서면 (욕실 쪽 -0.2m 이동) ───────────────────
    [7.3, zBath, 7.3, zB],
    // ── 거실↔주방 배관 기둥 외곽 (3면) ──────────────────────────────
    [4.90, zT, 4.90, 0.75], [4.90, 0.75, 5.30, 0.75], [5.30, zT, 5.30, 0.75],
    // ── 신발장 옆 기둥 외곽 (2면, 동/남은 복도벽·창고벽과 합치) ─────
    [9.88, 3.77, 9.88, 4.14],     // 서면 (현관 향)
    [9.88, 3.77, 10.44, 3.77],    // 북면 (현관 향)
    // ── 욕실 젠다이 앞면 (2 세그먼트, 벽 80 z=6.6 ~ 젠다이 앞면 z=6.39) ───
    [5.16, 6.39, 6.50, 6.39],     // 젠다이 1 — 좌측 (좌측 벽~샤워 파티션 좌면)
    [6.60, 6.39, 7.30, 6.39],     // 젠다이 2 — 우측 (샤워 파티션 우면~벽 107)
  ];

  // 문 위치 (참조용 번호 부여) [x, z, label]
  // 순서는 반드시 _doors[] 등록 순서와 일치해야 함 (AIM 라벨 정확성).
  // _doors[] 등록 순서(코드 실행 순서) 기준으로 정렬됨:
  //   inline 1 (index.html, 침실2~발코니 5 doors)
  //   → furniture.js 파일 순서: @FURN#68 붙박이장(6) → @FURN#69 붙박이장2(3)
  //                            → @FURN#51,52 주방 하부장 앞(5)+우(4)
  //                            → @FURN#73 주방 플랩 상부장 우(2)
  //                            → @FURN#57 거울장(1)
  //   → inline 2 (수납장+냉장고 좌·우, 외부문, 방화문, 신발장 좌·우)
  //   → 영림 3연동 중문 (3 패널, kind='slide')
  // 안정 식별자(@DOOR#NN): 미니맵 글로벌 번호와 일치 — '@DOOR#34' 같은 식으로 정확 grep 가능.
  // 주의: 가구·문 추가 시 글로벌 번호가 자동 시프트됨 — 라벨 텍스트로 grep 권장.
  var DOORS = [
    [5.10,  3.95, '침실2 문'],            // @DOOR#16 _doors[0]   inline 1
    [8.25,  4.20, '창고 문'],             // @DOOR#17 _doors[1]   inline 1
    [5.80,  4.80, '욕실 문'],             // @DOOR#18 _doors[2]   inline 1
    [1.05,  0.90, '창고2 문'],            // @DOOR#19 _doors[3]   inline 1
    [0.75,  3.50, '발코니 문'],           // @DOOR#20 _doors[4]   inline 1
    [8.08,  5.93,   '붙박이장 문 1'],     // @DOOR#21 _doors[5]   @FURN#68 페어1 좌
    [8.48,  5.93,   '붙박이장 문 2'],     // @DOOR#22 _doors[6]   @FURN#68 페어1 우
    [8.88,  5.93,   '붙박이장 문 3'],     // @DOOR#23 _doors[7]   @FURN#68 페어2 좌
    [9.28,  5.93,   '붙박이장 문 4'],     // @DOOR#24 _doors[8]   @FURN#68 페어2 우
    [9.68,  5.93,   '붙박이장 문 5'],     // @DOOR#25 _doors[9]   @FURN#68 페어3 좌
    [10.08, 5.93,   '붙박이장 문 6'],     // @DOOR#26 _doors[10]  @FURN#68 페어3 우
    [9.44,  4.87,   '붙박이장 2 문 1'],   // @DOOR#27 _doors[11]  @FURN#69 페어 좌
    [9.84,  4.87,   '붙박이장 2 문 2'],   // @DOOR#28 _doors[12]  @FURN#69 페어 우
    [10.24, 4.87,   '붙박이장 2 문 3'],   // @DOOR#29 _doors[13]  @FURN#69 단일
    [5.58,  0.66,   '주방 하부장(앞) 1'], // @DOOR#30 _doors[14]  @FURN#51 페어1 좌
    [6.06,  0.66,   '주방 하부장(앞) 2'], // @DOOR#31 _doors[15]  @FURN#51 페어1 우
    [6.54,  0.66,   '주방 하부장(앞) 3'], // @DOOR#32 _doors[16]  @FURN#51 페어2 좌
    [7.02,  0.66,   '주방 하부장(앞) 4'], // @DOOR#33 _doors[17]  @FURN#51 페어2 우
    [7.50,  0.66,   '주방 하부장(앞) 5'], // @DOOR#34 _doors[18]  @FURN#51 단일
    [7.14,  0.9075, '주방 하부장(우) 1'], // @DOOR#35 _doors[19]  @FURN#52 페어1 전
    [7.14,  1.4025, '주방 하부장(우) 2'], // @DOOR#36 _doors[20]  @FURN#52 페어1 후
    [7.14,  1.8975, '주방 하부장(우) 3'], // @DOOR#37 _doors[21]  @FURN#52 페어2 전
    [7.14,  2.3925, '주방 하부장(우) 4'], // @DOOR#38 _doors[22]  @FURN#52 페어2 후
    [7.55,  1.30,   '플랩 상부장(우) 도어 1(하)'], // @DOOR#39 _doors[23] @FURN#73 z축 플랩, 단=하단 (반투명)
    [7.55,  2.00,   '플랩 상부장(우) 도어 2(상)'], // @DOOR#40 _doors[24] @FURN#73 z축 플랩, 단=상단 (반투명) — 사용자 재요청으로 플랩 복원
    [6.030, 6.42,   '거울장 문'],         // @DOOR#41 _doors[25]  @FURN#57
    [6.55,  4.14,   '수납장 문'],         // @DOOR#42 _doors[26]  inline 2 (A 컬럼 단일)
    [7.075, 4.14,   '냉장고 문(좌)'],     // @DOOR#43 _doors[27]  inline 2 (B 컬럼, 양문형 좌)
    [7.525, 4.14,   '냉장고 문(우)'],     // @DOOR#44 _doors[28]  inline 2 (C 컬럼, 양문형 우)
    [11.25, 0.00,   '현관 문'],           // @DOOR#45 _doors[29]  inline 2 (외벽 갭, 단순 우드)
    [10.50, 3.30,   '현관문 (방화문)'],   // @DOOR#46 _doors[30]  inline 2 (한국 아파트 표준 방화문)
    [9.14,  3.77,   '신발장 문(좌)'],     // @DOOR#47 _doors[31]  panelW 0.48, hinge cBaseX=8.90 → 패널 [8.90, 9.38] (몸체 외변 flush)
    [9.64,  3.77,   '신발장 문(우)'],     // @DOOR#48 _doors[32]  panelW 0.48, hinge cBaseX+cW=9.88 → 패널 [9.40, 9.88] (몸체 외변 flush)
    // ── 영림 초슬림 간살 3연동 중문 (linkGroup='jungmun', kind='slide') ──
    // 신발장 (@FURN#50, x=8.90~9.88) 좌측 외변에 부착 (xJM=8.855, 4mm 시각 갭).
    // z 범위 1.38m (서재·창고 벽 내면 사이, panelW=0.46). 클릭 시 3 패널
    // 모두 함께 +z 방향 슬라이드 (북쪽 적층, 신발장 좌면 따라 L-shape).
    [8.825, 2.99,   '영림 중문 패널 1 (남)'], // @DOOR#49 _doors[33]  닫힘 z=2.76~3.22, 열림 시 +0.92m → z=3.68~4.14
    [8.855, 3.45,   '영림 중문 패널 2 (중)'], // @DOOR#50 _doors[34]  닫힘 z=3.22~3.68, 열림 시 +0.46m → z=3.68~4.14
    [8.885, 3.91,   '영림 중문 패널 3 (북)'], // @DOOR#51 _doors[35]  닫힘 z=3.68~4.14, 정지 (적층 기준 위치)
  ];

  // 가구 위치 (참조용 번호 부여) [x, z, label]
  // 안정 식별자(@FURN#NN): 글로벌 번호 = 15(ROOMS) + 31(DOORS) + i + 1.
  //   i=0  → @FURN#47, i=27 → @FURN#74. 코드 안 IIFE 첫 줄에도 같은 앵커 부착.
  var FURNITURE = [
    [0.50,  6.09, '드럼세탁기'],          // @FURN#47 발코니 좌측, 0.9×0.9×1.275 m
    [3.30,  5.52, '침실2 침대'],          // @FURN#48 퀸, 1.65×2.05×0.22(프레임)
    [10.04, 1.35, '서재 책상'],          // @FURN#49 동측 벽 부착, 1.80×0.80×0.74
    [9.39,  3.955,'현관 신발장'],         // @FURN#50 양문형 좌측 2칸 활성, 우측 1칸은 기둥, 폭 0.98 (좌측 20cm 수축)
    [6.54,  0.36, '주방 하부장(앞)'],     // @FURN#51 z=0 앞벽, 5분할 도어
    [7.44,  1.65, '주방 하부장(우)'],     // @FURN#52 x=7.8 우벽, 4분할 도어
    [5.55,  5.97, '욕실 변기'],           // @FURN#53 원피스, 좌측 벽
    [6.03,  6.20, '욕실 세면대'],         // @FURN#54 스퀘어 월행
    [6.55,  6.00, '샤워 파티션'],         // @FURN#55 솔리드 하단 + 유리 상단
    [5.15,  5.90, '욕실 휴지걸이'],       // @FURN#56 매립형, 변기 옆
    [6.03,  6.48, '욕실 거울장'],         // @FURN#57 세면대 상부, 인터랙티브 도어
    [6.55,  4.44, '수납장'],              // @FURN#58 키친핏 A 컬럼 (좌측 단일도어)
    [7.30,  4.44, '냉장고'],              // @FURN#59 키친핏 B+C 컬럼 (양문형)
    [5.545, 6.50, '욕실 벽등(상)'],       // @FURN#60 y=2.108 (거울장 top)
    [5.545, 6.50, '욕실 벽등(하)'],       // @FURN#61 y=1.842 (거울장 중심)
    [6.54,  0.405,'주방 상부장(앞)'],     // @FURN#62 y=1.55~2.40, 깊이 0.69 m (배관 기둥 정렬)
    [0.55,  1.80, '실내 자전거'],         // @FURN#63 거실확장 NW 코너 (Tacx Neo Bike Smart 스타일)
    [9.84,  0.185,'서재 책꽂이 1'],      // @FURN#64 서재 NE 코너, 폭 1.20 m, 5단 오픈 (북측 우)
    [8.64,  0.185,'서재 책꽂이 2'],      // @FURN#65 책꽂이 64 좌측 인접, 폭 1.20 m (북측 좌)
    [9.64,  2.515,'서재 책꽂이 3'],      // @FURN#66 책꽂이 64 의 z 미러 (남측), 폭 1.60 m
    [8.06,  1.40, '벽걸이 로드 자전거'],  // @FURN#67 벽 76 수평 마운트 (S-Works 스타일)
    [9.08,  6.24, '창고 붙박이장'],       // @FURN#68 창고 남측, 폭 2.40 m, 6-door
    [9.84,  4.56, '창고 붙박이장 2'],     // @FURN#69 창고 북측 벽, 폭 1.20 m, 3-door
    [1.985, 1.16, '거실 소파'],           // @FURN#70 2-seater, 등받이 벽 103 부착
    [3.60,  0.76, '거실 다이닝 테이블'],  // @FURN#71 오크 슬랩 트레슬, 1.60×0.80×0.73 m
    [3.60,  0.21, '거실 벤치'],           // @FURN#72 매칭 우드 벤치, 1.40×0.30×0.42 m
    [7.58,  1.65, '주방 플랩 상부장(우)'], // @FURN#73 벽 90 상단, 2단 플랩 도어 (위로 들어올림)
    [7.665, 0.36, '난방수 분배기'],       // @FURN#74 벽 94 (주방 우벽 x=7.8) 정면 바닥, 5/8 미팅 결정
  ];

  // 창문 위치 (참조용 번호 부여) [x, z, label]
  // 안정 식별자(@WIN#NN): 글로벌 번호 = 15+31+28+WALLS.length+i+1.
  //   현재 WALLS.length=43 이므로 i=0 → @WIN#118 ... i=4 → @WIN#122.
  //   주의: WALLS 항목 추가/삭제 시 WIN 번호도 자동으로 시프트됨 (어셔션 §M 이 카운트 검증).
  var WINDOWS = [
    [0,    2.20, '거실확장 베란다창①'],   // @WIN#118 좌측 외벽 거실확장 구간 (유리①)
    [0,    5.05, '발코니 베란다창②'],     // @WIN#119 좌측 외벽 발코니 구간 (유리②)
    [1.5,  5.05, '침실2-발코니 창'],       // @WIN#120 발코니 격벽, 폭 2.0 m
    [10.5, 1.41, '서재-복도 창'],         // @WIN#121 폭 1.35 m
    [10.5, 5.34, '창고-복도 창'],          // @WIN#122 폭 1.35 m
  ];

  // 가구 bbox — 4요소 [x1,z1,x2,z2] (xz만) 또는 6요소 [x1,z1,x2,z2,y1,y2] (y도 체크)
  // FURNITURE 배열 인덱스와 동일 순서. 주석의 번호는 새 글로벌 번호(가구 27~).
  var FURNITURE_BBOX = [
    [0.05,  5.64,  0.95,  6.54],            // 27 드럼세탁기
    [2.475, 4.49,  4.125, 6.54],            // 28 침실2 침대
    [9.64,  0.45,  10.44, 2.25],            // 29 서재 책상
    [8.9,   3.77,  9.88,  4.14],            // @FURN#50 현관 신발장 (좌측 2칸만, 우측 1칸은 방 15 기둥) — 폭 0.98 (좌측 20cm 수축, 벽 96 쪽 부착)
    [5.34,  0.06,  7.74,  0.66, 0,    1.0],  // 31 주방 하부장(앞)  — y 1.0 이하
    [7.14,  0.66,  7.74,  2.64, 0,    1.0],  // 32 주방 하부장(우)  — y 1.0 이하 (상부장 제거)
    [5.36,  5.795, 5.74,  6.39, 0,    0.78],// 37 욕실 변기 — 젠다이 -15cm 이동
    [5.78,  6.01,  6.28,  6.39],            // 38 욕실 세면대 — 젠다이 -15cm 이동
    [6.49,  5.45,  6.61,  6.55],            // 39 샤워 파티션 — 표면 hit 포함하도록 1cm 확장
    [5.086, 5.82,  5.16,  5.98],            // 40 욕실 휴지걸이 — 젠다이 -15cm 이동
    [5.755, 6.42,  6.305, 6.54],            // 37 욕실 거울장
    [6.25,  4.14,  6.85,  4.74],            // 37 수납장 (A 컬럼)
    [6.85,  4.14,  7.75,  4.74],            // 38 냉장고 (B+C 컬럼)
    [5.40,  6.40,  5.69,  6.55, 1.96, 2.27],// 40 욕실 벽등(상) — y center 2.108
    [5.40,  6.40,  5.69,  6.55, 1.69, 1.95],// 41 욕실 벽등(하) — y center 1.842
    [5.34,  0.06,  7.74,  0.75, 1.5,  2.4 ],// @FURN#62 주방 상부장(앞) — 깊이 0.69 m (배관 기둥 앞면 정렬)
    [0.20,  1.05,  0.90,  2.55, 0,    1.60],// 47 실내 자전거 (디테일 강화)
    [9.24,  0.06,  10.44, 0.31, 0,    1.85],// @FURN#64 서재 책꽂이 1 (NE 코너, 벽 59 등+벽 74 우측면, 폭 1.20m)
    [8.04,  0.06,  9.24,  0.31, 0,    1.85],// @FURN#65 서재 책꽂이 2 (책꽂이1 좌측 인접, 폭 1.20m)
    [8.84,  2.39,  10.44, 2.64, 0,    1.85],// @FURN#66 서재 책꽂이 3 (책꽂이1 의 z 미러, 남측 벽, 폭 1.60m)
    [8.00,  0.50,  8.18,  2.20, 0.55, 1.50],// @FURN#67 벽걸이 로드 자전거 (벽 76 20cm 거리)
    [7.88,  5.94,  10.28, 6.54, 0,    2.40],// @FURN#68 창고 붙박이장 (남측, 폭 2.40m, 6-door)
    [9.24,  4.26,  10.44, 4.86, 0,    2.40],// @FURN#69 창고 붙박이장 2 (북측 벽, 우측면 벽 94 부착, 폭 1.20m, 3-door)
    [1.56,  0.06,  2.41,  2.26, 0,    0.95],// @FURN#70 거실 소파 (등받이 벽 103, 양쪽 팔걸이, 방 5 향함)
    [2.80,  0.36,  4.40,  1.16, 0,    0.73],// @FURN#71 거실 다이닝 테이블 (벽 76 측 이동)
    [2.90,  0.06,  4.30,  0.36, 0,    0.42],// @FURN#72 거실 벤치 (벽 76 부착)
    [7.44,  1.05,  7.74,  2.25, 1.50, 2.10],// @FURN#73 주방 플랩 상부장(우) — 축소판, 반투명 2단 플랩, 천장에서 30cm 아래
    [7.59,  0.11,  7.74,  0.61, 0.10, 0.50],// @FURN#74 난방수 분배기 — 벽 94 정면 바닥, 주방 하부장(우) 남측 빈 공간
  ];

  // 창문 bbox [x1, z1, x2, z2] — 벽 두께 ±0.10 인셋, AIM 조준용
  // WINDOWS 배열과 동일 인덱스
  var WINDOWS_BBOX = [
    [-0.10, 0.96,  0.10, 3.44],   // 거실확장 베란다창①
    [-0.10, 3.56,  0.10, 6.54],   // 발코니 베란다창②
    [ 1.40, 4.05,  1.60, 6.05],   // 침실2-발코니 창
    [10.40, 0.735, 10.60, 2.085], // 서재-복도 창 (1.5x 확장)
    [10.40, 4.665, 10.60, 6.015], // 창고-복도 창 (1.5x 확장)
  ];
  // 창문 수직 정보 — sill(하단 y) 와 높이(m). SHIFT 치수 표시용.
  // 인덱스는 WINDOWS_BBOX 와 1:1 일치.
  var WINDOWS_Y0 = [0.10, 0.10, 0.9, 0.9, 0.9];                     // sill height (m)
  var WINDOWS_H  = [CH - 0.10, CH - 0.10, 1.20, 1.10, 1.10];         // window height (m)

  // SHIFT 키 추적 (조준 라벨 표시용 — 1인칭/프리 모두)
  var _shiftHeld = false;
  window.addEventListener('keydown', function(e){ if (e.key === 'Shift') _shiftHeld = true; });
  window.addEventListener('keyup',   function(e){ if (e.key === 'Shift') _shiftHeld = false; });
  window.addEventListener('blur',    function(){ _shiftHeld = false; });

  // 마우스 위치 추적 (프리 카메라 모드 조준용)
  var _mouseX = 0, _mouseY = 0;
  window.addEventListener('mousemove', function(e){
    _mouseX = e.clientX;
    _mouseY = e.clientY;
  });
  var aimLabel = document.getElementById('aim-label');

  // 점-선분 거리 (xz 평면)
  function _ptToSeg(px, py, x1, y1, x2, y2){
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return Math.hypot(px-x1, py-y1);
    var t = ((px-x1)*dx + (py-y1)*dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px-(x1+t*dx), py-(y1+t*dy));
  }

  // 크로스헤어/커서 조준 결과 → {n, label, type} 또는 null
  // ndcX/ndcY: 정규화된 디바이스 좌표 (1인칭은 0,0 / 프리 모드는 마우스 위치)
  /* 크로스헤어/커서 조준 결과 → 적용되는 *모든* 카테고리의 info 객체 배열.
     사용자 요청 (2026-05-08): 한 위치에 여러 벌룬이 동시 적용되면 전환 대신
     모두 표시. 우선순위 (최다 구체 → 최소 구체) 로 배열에 push:
       1) 문    — 첫 hit 가 _doors[i].pivot 후손
       2) 콘센트 — 첫 hit 가 _outlets[i].plate 후손 (문과 상호 배타)
       3) 가구  — hit 점이 bbox 안 (5mm 인셋)
       4) 창문  — hit 점이 bbox 안
       5) 벽    — hit 점이 segment 15cm 이내
       6) 방    — hit 점이 ROOM 사각형 안 (가장 작은 box 우선)
     문/콘센트는 첫 hit 기반 (mesh 식별), 나머지는 hit 점 기반 (좌표 검사).
     반환: [info, ...] (빈 배열 = 매칭 없음).
  */
  function _getAllAimInfo(ndcX, ndcY){
    if (ndcX === undefined) ndcX = 0;
    if (ndcY === undefined) ndcY = 0;
    var ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    ray.far = 25;
    var hits = ray.intersectObjects(scene.children, true);
    if (hits.length === 0) return [];
    var hit = hits[0];
    var p = hit.point;
    var results = [];

    // 1) 문 — 첫 hit 객체가 _doors[i].pivot 의 후손인지
    var doorIdx = -1;
    for (var i = 0; i < _doors.length && doorIdx < 0; i++) {
      var pv = _doors[i].pivot;
      var cur = hit.object;
      while (cur) {
        if (cur === pv) { doorIdx = i; break; }
        cur = cur.parent;
      }
    }
    if (doorIdx >= 0) {
      var num = ROOMS.length + doorIdx + 1;
      results.push({n:num, type:'door', label:'문 '+num+': '+DOORS[doorIdx][2]});
    }

    // 2) 콘센트 — 문과 상호 배타 (단일 hit.object 기반).
    //    문이 매칭됐으면 콘센트 검사 skip — 한 mesh 가 둘 다 일 수 없음.
    if (doorIdx < 0 && typeof _outlets !== 'undefined') {
      for (var oi = 0; oi < _outlets.length; oi++) {
        var op = _outlets[oi].plate;
        var cur2 = hit.object;
        var matchedOutlet = false;
        while (cur2) {
          if (cur2 === op) { matchedOutlet = true; break; }
          cur2 = cur2.parent;
        }
        if (matchedOutlet) {
          var spec = _outlets[oi].spec;
          var lbl = '콘센트 ' + (oi+1) + ': ' +
                    (spec.label || (spec.gangs + '구')) +
                    ' (' + spec.gangs + '구' +
                    (spec.kind === 'wet' ? ', 방수' : '') + ')';
          results.push({ n: oi+1, type:'outlet', label: lbl, outletPlate: op });
          break;
        }
      }
    }

    // 3) 가구 — hit 점이 bbox 안. PP/미팅 모드 (window._outletViewActive) 시
    //    _ppVisibleFurnIdxs 만 통과 (CL 50995: powerPlanMode → _outletViewActive).
    var ins = 0.005;
    var furnMatched = -1, bestDist = Infinity;
    var ppmVisIdxs = (window._outletViewActive && window._ppVisibleFurnIdxs) ? window._ppVisibleFurnIdxs : null;
    for (var fi = 0; fi < FURNITURE_BBOX.length; fi++) {
      if (ppmVisIdxs && !ppmVisIdxs.has(fi)) continue;
      var b = FURNITURE_BBOX[fi];
      if (p.x < b[0]+ins || p.x > b[2]-ins) continue;
      if (p.z < b[1]+ins || p.z > b[3]-ins) continue;
      if (b.length >= 6 && (p.y < b[4] || p.y > b[5])) continue;
      var d = Math.hypot(p.x - FURNITURE[fi][0], p.z - FURNITURE[fi][1]);
      if (d < bestDist) { bestDist = d; furnMatched = fi; }
    }
    if (furnMatched >= 0) {
      var num2 = ROOMS.length + DOORS.length + furnMatched + 1;
      results.push({n:num2, type:'furn', label:'가구 '+num2+': '+FURNITURE[furnMatched][2]});
    }

    // 4) 창문 — hit 점이 bbox 안
    for (var wi2 = 0; wi2 < WINDOWS_BBOX.length; wi2++) {
      var bw = WINDOWS_BBOX[wi2];
      if (p.x >= bw[0] && p.x <= bw[2] && p.z >= bw[1] && p.z <= bw[3]) {
        var num3 = ROOMS.length + DOORS.length + FURNITURE.length + WALLS.length + wi2 + 1;
        results.push({n:num3, type:'win', label:'창문 '+num3+': '+WINDOWS[wi2][2]});
        break;
      }
    }

    // 5) 벽 — 가장 가까운 segment 15cm 이내
    var minWD = Infinity, wIdx = -1;
    for (var wj = 0; wj < WALLS.length; wj++) {
      var w = WALLS[wj];
      var dw = _ptToSeg(p.x, p.z, w[0], w[1], w[2], w[3]);
      if (dw < minWD) { minWD = dw; wIdx = wj; }
    }
    if (minWD < 0.15 && wIdx >= 0) {
      var num4 = ROOMS.length + DOORS.length + FURNITURE.length + wIdx + 1;
      results.push({n:num4, type:'wall', label:'벽 '+num4});
    }

    // 6) 방 — hit 점이 ROOM 사각형 안. 역순 (가장 작은 box, 즉 PD/chase/기둥 우선).
    for (var ri = ROOMS.length - 1; ri >= 0; ri--) {
      var r = ROOMS[ri];
      if (p.x >= r[0] && p.x <= r[2] && p.z >= r[1] && p.z <= r[3]) {
        var num5 = ri + 1;
        results.push({n:num5, type:'room', label:'방 '+num5 + (r[5] ? ': '+r[5] : '')});
        break;
      }
    }
    return results;
  }

  /* 조준 안정화 (hysteresis) — 사용자 요청 (2026-05-08) 으로 제거됨.
     이전: 단일 라벨 시스템에서 두 카테고리 사이 깜빡임 방지용 220 ms hold.
     현재: 여러 카테고리가 동시 적용되면 모두 표시 (multi-label) — 전환
     자체가 없으므로 hysteresis 불필요. 매 프레임 _getAllAimInfo() 결과
     그대로 렌더. (경계 상에서 일부 카테고리 on/off 깜빡임은 있을 수
     있으나, 사용자 요청 기조 — '전환 대신 동시 표시' — 우선.)
     필요 시 per-type 짧은 hold 추가 가능. */

  /* 콘센트 하이라이트 (사용자 요청) — SHIFT-aim 으로 outlet 잡힐 때 plate 둘레에
     노란 wireframe BoxHelper 를 띄워 시각 강조. depthTest:false 로 어디서나 보임.
     대상 변경/없음 시 정리. */
  var _outletHL = null;     // 현재 표시 중인 BoxHelper
  var _outletHLTarget = null;
  function _showOutletHighlight(plateMesh){
    if (plateMesh === _outletHLTarget) return;       // 이미 같은 대상에 표시 중
    if (_outletHL) {
      scene.remove(_outletHL);
      if (_outletHL.geometry) _outletHL.geometry.dispose();
      if (_outletHL.material) _outletHL.material.dispose();
      _outletHL = null;
    }
    _outletHLTarget = plateMesh;
    if (plateMesh) {
      var box = new THREE.BoxHelper(plateMesh, 0xffe040);  // 노란 외곽선
      box.material.depthTest = false;
      box.material.transparent = true;
      box.material.opacity = 0.95;
      box.renderOrder = 998;                                // dim sprite (999) 보다 아래
      scene.add(box);
      _outletHL = box;
    }
  }

  // PP/미팅 모드에서 aim 라벨이 반응하는 객체 type set — 새 카테고리 추가는 여기에만.
  var PP_AIM_TYPES_NO_SHIFT   = new Set(['outlet']);
  var PP_AIM_TYPES_WITH_SHIFT = new Set(['outlet', 'wall']);

  // HTML escape — 라벨 텍스트의 <, >, & 문자를 안전하게 처리.
  function _esc(s){
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 라벨 갱신 — 매 프레임 drawMinimap에서 호출. 사용자 요청 (2026-05-08):
  // 한 위치에 여러 카테고리가 적용되면 모두 표시 (.aim-item 자식으로 stack).
  // 1인칭: 화면 중앙(크로스헤어, NDC=0,0) / 프리: 마우스 커서 위치를 NDC로 변환
  // PP/미팅 모드 (window._outletViewActive): SHIFT 없이도 콘센트 hit 시 라벨 + 높이 표시.
  // (CL 50995: powerPlanMode → _outletViewActive — PP 와 미팅 양 모드 공통 필터.)
  function _updateAimLabel(){
    var ppm = !!window._outletViewActive;
    if (!_shiftHeld && !ppm) {
      if (aimLabel.style.display !== 'none') {
        aimLabel.style.display = 'none';
        aimLabel.innerHTML = '';
      }
      _showDimensions(null);
      _showOutletHighlight(null);
      return;
    }
    var matches, posX, posY;
    if (freeMode) {
      var rect = renderer.domElement.getBoundingClientRect();
      var ndcX =  ((_mouseX - rect.left) / rect.width)  * 2 - 1;
      var ndcY = -((_mouseY - rect.top)  / rect.height) * 2 + 1;
      matches = _getAllAimInfo(ndcX, ndcY);
      posX = _mouseX + 'px';
      posY = _mouseY + 'px';
    } else {
      matches = _getAllAimInfo(0, 0);
      posX = '50%';
      posY = '50%';
    }
    // 전원 계획 모드: 허용 type set 기반 필터 — 새 카테고리 추가 시 set 만 갱신.
    //  - SHIFT 미누름: 콘센트만 반응
    //  - SHIFT 누름:   콘센트 + 벽 (사용자 요청)
    //  그 외 객체(방·문·창·가구) 는 PP 모드에서 항상 무시.
    if (ppm) {
      var ppAllowed = _shiftHeld ? PP_AIM_TYPES_WITH_SHIFT : PP_AIM_TYPES_NO_SHIFT;
      matches = matches.filter(function(m){ return ppAllowed.has(m.type); });
    }
    if (matches.length === 0) {
      aimLabel.style.display = 'none';
      aimLabel.innerHTML = '';
      _showDimensions(null);
      _showOutletHighlight(null);
      return;
    }
    // 모든 매치를 stacked .aim-item 으로 렌더 — 컨테이너 #aim-label 의 innerHTML.
    var html = '';
    var outletMatch = null;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      var labelText = m.label;
      // 전원 계획 모드 + 콘센트: 높이(cm) 추가 표시.
      if (ppm && m.type === 'outlet' && typeof _outlets !== 'undefined') {
        var spec = _outlets[m.n - 1].spec;
        labelText += ' • 높이 ' + Math.round(spec.y * 100) + ' cm';
      }
      html += '<div class="aim-item t-' + m.type + '">' + _esc(labelText) + '</div>';
      if (m.type === 'outlet') outletMatch = m;
    }
    aimLabel.innerHTML = html;
    aimLabel.className = '';   // 컨테이너에는 t-XXX 클래스 없음
    aimLabel.style.left = posX;
    aimLabel.style.top  = posY;
    aimLabel.style.display = 'block';

    // 치수 sprite — primary (가장 구체적인) 매치 1 개만 적용. PP 모드에서는 생략.
    var primary = matches[0];
    _showDimensions((_shiftHeld && !ppm) ? primary : null);

    // 콘센트 outline highlight — 콘센트 매치 있으면 plate 강조.
    _showOutletHighlight(outletMatch ? outletMatch.outletPlate : null);
  }

  /* ─────────────────────────────────────────────────────────────────
     SHIFT-aim 치수 표시 (3D 스프라이트) — 사용자 요청 기능

     SHIFT + 조준 시 대상의 너비/길이/높이를 cm 단위로 보여주는
     라벨을 대상의 해당 모서리 근처에 부착. 라벨은 scene 의
     자식이라 카메라가 움직여도 대상에 그대로 고정.

     축 색상 (디버그 모드 그리드와 일관):
       너비(W, X 축) = 빨강 #ff4040
       길이(D, Z 축) = 파랑 #4080ff
       높이(H, Y 축) = 녹색 #40c060

     대상별 표시 항목:
       방   : 너비/길이/높이 (높이=CH=240cm)
       문   : 너비/두께/높이 — doorMesh 의 world bbox 에서 추출
       가구 : 너비/길이/높이 — FURNITURE_BBOX (xz) + 높이 스캔(y)
       벽   : 길이/높이 (사용자 선택 1b — 두께 생략)
       창문 : 길이/높이 (WINDOWS_BBOX + WINDOWS_Y0/H)
  ─────────────────────────────────────────────────────────────────── */
  var _dimGroup = new THREE.Group();
  _dimGroup.name = '_dimOverlay';
  _dimGroup.visible = false;
  scene.add(_dimGroup);

  var DIM_COLOR = { W:'#ff4040', D:'#4080ff', H:'#40c060' };

  function _makeDimSprite(text, color){
    var canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.strokeRect(2.5, 2.5, 251, 59);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 36);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map:tex, depthTest:false, depthWrite:false });
    var sp = new THREE.Sprite(mat);
    sp.scale.set(0.5, 0.125, 1);   // world meters: 50cm × 12.5cm 라벨
    sp.renderOrder = 999;          // 항상 위에
    return sp;
  }
  function _addDim(axis, valueCm, x, y, z){
    var sp = _makeDimSprite(valueCm + ' cm', DIM_COLOR[axis]);
    sp.position.set(x, y, z);
    _dimGroup.add(sp);
  }
  // 치수 선분 — 라벨이 가리키는 모서리를 색으로 강조 (라벨과 동일 축 색상).
  // depthTest:false 로 항상 위에 표시. 1px 두께(WebGL 기본).
  function _addDimLine(axis, x1,y1,z1, x2,y2,z2){
    var pts = new Float32Array([x1,y1,z1, x2,y2,z2]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({
      color: DIM_COLOR[axis], depthTest:false, depthWrite:false
    });
    var line = new THREE.Line(geo, mat);
    line.renderOrder = 998;   // sprite(999) 보다 아래, 일반 메시 위
    _dimGroup.add(line);
  }
  function _clearDimGroup(){
    while (_dimGroup.children.length){
      var c = _dimGroup.children[0];
      if (c.geometry) c.geometry.dispose();   // Line: 신규 생성된 BufferGeometry 해제
      if (c.material){
        if (c.material.map) c.material.map.dispose();
        c.material.dispose();
      }
      _dimGroup.remove(c);
    }
  }
  function _cm(v){ return Math.round(v * 100); }

  /* 가구 높이 스캔 — FURNITURE_BBOX 가 4 요소(xz만) 인 경우 scene 의
     메시들을 traverse 해 해당 bbox 안에 들어가는 메시들의 y 범위
     합집합을 계산. 스트럭처(외벽·바닥·천장) 제외 휴리스틱 적용. */
  var _furnitureH = null;
  function _computeFurnitureHeights(){
    var arr = [];
    FURNITURE_BBOX.forEach(function(b, i){
      if (b.length >= 6) {
        arr[i] = { min:b[4], max:b[5] };
        return;
      }
      var minY = Infinity, maxY = -Infinity;
      var bboxW = b[2] - b[0], bboxD = b[3] - b[1];
      scene.traverse(function(obj){
        if (!obj.isMesh) return;
        if (!obj.geometry) return;
        if (obj === _dimGroup) return;
        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
        var box = new THREE.Box3().copy(obj.geometry.boundingBox);
        box.applyMatrix4(obj.matrixWorld);
        var cx = (box.min.x + box.max.x) / 2;
        var cz = (box.min.z + box.max.z) / 2;
        if (cx < b[0] || cx > b[2] || cz < b[1] || cz > b[3]) return;
        var mw = box.max.x - box.min.x;
        var md = box.max.z - box.min.z;
        // 스트럭처(벽/바닥/천장) 휴리스틱 — bbox 보다 크게 튀어나오면 제외
        if (mw > bboxW + 0.30 || md > bboxD + 0.30) return;
        if (box.min.y < minY) minY = box.min.y;
        if (box.max.y > maxY) maxY = box.max.y;
      });
      arr[i] = (minY < Infinity) ? { min:minY, max:maxY } : null;
    });
    return arr;
  }

  var _dimsCurrentTarget = null;   // 현재 표시 중인 대상 ID (변동 시에만 재구축)
  function _showDimensions(info){
    var newId = info ? (info.type + '-' + info.n) : null;
    if (newId === _dimsCurrentTarget){
      _dimGroup.visible = !!info;
      return;
    }
    _clearDimGroup();
    _dimsCurrentTarget = newId;
    if (!info){
      _dimGroup.visible = false;
      return;
    }

    if (_furnitureH === null) _furnitureH = _computeFurnitureHeights();

    // 모든 대상의 라벨/선분은 'bottom-front-left' 코너 (x1, y0, z1) 에서
    // 각 축으로 뻗어나가는 모서리에 부착. 라벨은 모서리 정확히 중앙에 배치
    // → 사용자가 어느 모서리(=어느 길이)를 가리키는지 즉시 판별 가능.
    if (info.type === 'room'){
      var r = ROOMS[info.n - 1];
      var x1=r[0], z1=r[1], x2=r[2], z2=r[3];
      var y0 = FT;
      // W: 바닥 앞쪽 모서리 (x1→x2, z=z1)
      _addDimLine('W', x1, y0, z1, x2, y0, z1);
      _addDim    ('W', _cm(x2-x1), (x1+x2)/2, y0, z1);
      // D: 바닥 좌측 모서리 (z1→z2, x=x1)
      _addDimLine('D', x1, y0, z1, x1, y0, z2);
      _addDim    ('D', _cm(z2-z1), x1, y0, (z1+z2)/2);
      // H: 좌측-앞쪽 수직 모서리 (y0→y0+CH)
      _addDimLine('H', x1, y0, z1, x1, y0+CH, z1);
      _addDim    ('H', _cm(CH), x1, y0+CH/2, z1);

    } else if (info.type === 'door'){
      var di = info.n - 1 - ROOMS.length;
      var doorMesh = _doors[di] && _doors[di].doorMesh;
      if (!doorMesh) return;
      if (!doorMesh.geometry.boundingBox) doorMesh.geometry.computeBoundingBox();
      var box = new THREE.Box3().copy(doorMesh.geometry.boundingBox);
      box.applyMatrix4(doorMesh.matrixWorld);
      var bx=box.min.x, bz=box.min.z, by=box.min.y;
      var ex=box.max.x, ez=box.max.z, ey=box.max.y;
      _addDimLine('W', bx, by, bz, ex, by, bz);
      _addDim    ('W', _cm(ex-bx), (bx+ex)/2, by, bz);
      _addDimLine('D', bx, by, bz, bx, by, ez);
      _addDim    ('D', _cm(ez-bz), bx, by, (bz+ez)/2);
      _addDimLine('H', bx, by, bz, bx, ey, bz);
      _addDim    ('H', _cm(ey-by), bx, (by+ey)/2, bz);

    } else if (info.type === 'furn'){
      var fi = info.n - 1 - ROOMS.length - DOORS.length;
      var b = FURNITURE_BBOX[fi];
      var x1=b[0], z1=b[1], x2=b[2], z2=b[3];
      var h = _furnitureH[fi];
      var y0 = h ? h.min : FT;
      var y1 = h ? h.max : null;
      _addDimLine('W', x1, y0, z1, x2, y0, z1);
      _addDim    ('W', _cm(x2-x1), (x1+x2)/2, y0, z1);
      _addDimLine('D', x1, y0, z1, x1, y0, z2);
      _addDim    ('D', _cm(z2-z1), x1, y0, (z1+z2)/2);
      if (y1 !== null) {
        _addDimLine('H', x1, y0, z1, x1, y1, z1);
        _addDim    ('H', _cm(y1-y0), x1, (y0+y1)/2, z1);
      }

    } else if (info.type === 'wall'){
      var wi = info.n - 1 - ROOMS.length - DOORS.length - FURNITURE.length;
      var w = WALLS[wi];
      var dx = w[2]-w[0], dz = w[3]-w[1];
      var len = Math.sqrt(dx*dx + dz*dz);
      // 길이 — 벽 세그먼트 자체를 따라 (바닥에 살짝 붙여 그림)
      _addDimLine('D', w[0], FT, w[1], w[2], FT, w[3]);
      _addDim    ('D', _cm(len), (w[0]+w[2])/2, FT, (w[1]+w[3])/2);
      // 높이 — 시작점에서 수직 위로
      _addDimLine('H', w[0], FT, w[1], w[0], FT+CH, w[1]);
      _addDim    ('H', _cm(CH), w[0], FT+CH/2, w[1]);

    } else if (info.type === 'win'){
      var wi = info.n - 1 - ROOMS.length - DOORS.length - FURNITURE.length - WALLS.length;
      var b = WINDOWS_BBOX[wi];
      var dx = b[2]-b[0], dz = b[3]-b[1];
      var h   = WINDOWS_H[wi];
      var y0  = WINDOWS_Y0[wi];
      var midX = (b[0]+b[2])/2, midZ = (b[1]+b[3])/2;
      if (dx >= dz) {
        // 창문 가로축이 X 방향
        _addDimLine('D', b[0], y0, midZ, b[2], y0, midZ);
        _addDim    ('D', _cm(dx), midX, y0, midZ);
        _addDimLine('H', b[0], y0, midZ, b[0], y0+h, midZ);
        _addDim    ('H', _cm(h),  b[0], y0+h/2, midZ);
      } else {
        // 창문 가로축이 Z 방향 (좌측 외벽 등)
        _addDimLine('D', midX, y0, b[1], midX, y0, b[3]);
        _addDim    ('D', _cm(dz), midX, y0, midZ);
        _addDimLine('H', midX, y0, b[1], midX, y0+h, b[1]);
        _addDim    ('H', _cm(h),  midX, y0+h/2, b[1]);
      }
    }

    _dimGroup.visible = true;
  }

  // 미니맵 외부 HTML 범례 — 항상 표시
  var legendEl = document.getElementById('minimap-legend');
  (function(){
    var nR = ROOMS.length;
    var nD = nR + DOORS.length;
    var nU = nD + FURNITURE.length;     // 가구 끝 번호
    var nW = nU + WALLS.length;          // 벽 끝 번호
    var nWin = nW + WINDOWS.length;      // 창문 끝 번호
    legendEl.innerHTML =
      '<span style="color:#5aa8e8">● 방 1~'+nR+'</span>' +
      '<span style="color:#ffd542">● 문 '+(nR+1)+'~'+nD+'</span>' +
      '<span style="color:#7ad06a">● 가구 '+(nD+1)+'~'+nU+'</span>' +
      '<span style="color:#ec6240">● 벽 '+(nU+1)+'~'+nW+'</span>' +
      '<span style="color:#3fc8e0">● 창문 '+(nW+1)+'~'+nWin+'</span>';
    legendEl.style.display = 'block';
  })();

  // Convert metre coords → canvas coords
  function mx(v){ return PAD + v * S; }
  function mz(v){ return PAD + v * S; }

  /* ─────────────────────────────────────────────────────────────────
     정적 레이어 캐시 (D 항목)
     매 프레임 drawMinimap() 이 호출되지만, 방 채움·벽 라인·방 라벨·
     타이틀·번호 배지(콜아웃+본체)는 한 번 계산되면 변하지 않는다.
     이를 두 개의 오프스크린 캔버스에 1회만 렌더하고, 본 캔버스에서는
     drawImage 로만 합성해 매 프레임 비용을 크게 줄인다.

       _staticBgCv  : 동적 레이어 아래 — bg + rooms + walls + room labels
       _staticTopCv : 동적 레이어 위   — title + 번호 배지 (콜아웃 + 본체)

     ROOMS/WALLS/DOORS/FURNITURE/WINDOWS 배열을 런타임에 변경하는 경우
     `_staticReady = false` 로 두 캔버스를 무효화해야 함.

     ⚠️ 번호 배지(콜아웃 + 본체) 는 hover-spread 기능을 위해 동적 레이어로
     이동했음. drawNumberOverlay() 는 매 프레임 main ctx 에 직접 호출.
     _staticTopCv 에는 타이틀 바만 캐시.
  ─────────────────────────────────────────────────────────────────── */
  var _staticBgCv  = document.createElement('canvas');
  _staticBgCv.width = CW;  _staticBgCv.height = CH2;
  var _staticBgCx  = _staticBgCv.getContext('2d');
  var _staticTopCv = document.createElement('canvas');
  _staticTopCv.width = CW;  _staticTopCv.height = CH2;
  var _staticTopCx = _staticTopCv.getContext('2d');
  var _staticReady = false;

  function drawStaticBgTo(c){
    // background
    c.fillStyle = '#18181e';
    c.fillRect(0, 0, CW, CH2);
    // rooms
    ROOMS.forEach(function(r){
      c.fillStyle = r[4];
      c.fillRect(mx(r[0]), mz(r[1]), (r[2]-r[0])*S, (r[3]-r[1])*S);
    });
    // wall lines
    c.strokeStyle = '#2a2a2a';
    c.lineWidth   = 4;
    c.lineCap     = 'round';
    WALLS.forEach(function(w){
      c.beginPath();
      c.moveTo(mx(w[0]), mz(w[1]));
      c.lineTo(mx(w[2]), mz(w[3]));
      c.stroke();
    });
    // room labels
    c.font         = 'bold 13px "Malgun Gothic",sans-serif';
    c.textAlign    = 'center';
    c.textBaseline = 'middle';
    ROOMS.forEach(function(r){
      if (!r[5]) return;
      c.fillStyle = 'rgba(0,0,0,0.65)';
      c.fillText(r[5], mx(r[6]), mz(r[7]));
    });
  }

  function drawStaticTopTo(c){
    // title bar — 번호 배지는 hover-spread 위해 동적으로 메인 ctx 에 그림
    c.fillStyle    = 'rgba(255,255,255,0.55)';
    c.font         = '11px "Malgun Gothic",sans-serif';
    c.textAlign    = 'left';
    c.textBaseline = 'top';
    c.fillText('평면도  (12 × 6.6 m)', PAD, 2);
  }

  function drawMinimap() {
    // 정적 레이어 1회 캐싱 (drawNumberOverlay 가 _badgeLayout 을 자동 생성)
    if (!_staticReady) {
      drawStaticBgTo(_staticBgCx);
      drawStaticTopTo(_staticTopCx);
      _staticReady = true;
    }

    // ── 정적 배경 (bg + rooms + walls + room labels) ────────────────
    ctx.drawImage(_staticBgCv, 0, 0);

    // ── camera FOV cone (동적) ──────────────────────────────────────
    var cx = mx(camera.position.x);
    var cz = mz(camera.position.z);
    // forward direction in canvas space:
    //   world fwd = (-sin(yaw), 0, -cos(yaw))
    //   canvas dx = -sin(yaw),  canvas dy = -cos(yaw)
    // atan2(-cos(yaw), -sin(yaw)) ≡ -π/2 - yaw  (mod 2π).
    // arc()/cos/sin 모두 2π-주기이므로 단순한 산술식으로 동치.
    var mapAngle = -Math.PI / 2 - yaw;
    var coneR    = 56;                          // 2× 확대 (S=20→40 비례)
    var halfFOV  = camera.fov * Math.PI / 360;   // = (camera.fov × π/180) / 2 — 단일 원천

    ctx.beginPath();
    ctx.moveTo(cx, cz);
    ctx.arc(cx, cz, coneR, mapAngle - halfFOV, mapAngle + halfFOV);
    ctx.closePath();
    ctx.fillStyle   = 'rgba(255,220,50,0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,50,0.65)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    // forward ray
    ctx.beginPath();
    ctx.moveTo(cx, cz);
    ctx.lineTo(cx + Math.cos(mapAngle)*coneR, cz + Math.sin(mapAngle)*coneR);
    ctx.strokeStyle = 'rgba(255,200,30,0.9)';
    ctx.lineWidth   = 1.6;
    ctx.stroke();

    // ── camera dot ───────────────────────────────────────────────────
    ctx.beginPath();
    ctx.arc(cx, cz, 5, 0, Math.PI*2);
    ctx.fillStyle   = '#ff4040';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ── 정적 상단 (title bar) ────────────────────────────────────────
    ctx.drawImage(_staticTopCv, 0, 0);

    // ── 동적 번호 배지 (hover-spread 지원) ──────────────────────────
    drawNumberOverlay(ctx);

    // ── 1인칭 SHIFT 조준 라벨 — freeMode/SHIFT 상태에 따라 표시/숨김 ──
    _updateAimLabel();
  }

  /* ─────────────────────────────────────────────────────────────────
     번호 오버레이 — SHIFT 키 누르고 있을 때 미니맵 위에 표시
       방(구역): 청색 원형 배지
       문: 황색 원형 배지
       벽: 적색 원형 배지 (작음)
     수정 요청 시 "○번 방", "○번 문", "○번 벽" 형식으로 참조 가능.
     drawBadge / drawNumberOverlay 모두 첫 인자로 그릴 대상 ctx 를 받음.
  ─────────────────────────────────────────────────────────────────── */
  function drawBadge(c, cx, cz, n, bg, fg, r, fontSz){
    c.beginPath();
    c.arc(cx, cz, r, 0, Math.PI*2);
    c.fillStyle = bg;
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = fg;
    c.font = 'bold ' + fontSz + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), cx, cz + 0.5);
  }

  /* 배지 레이아웃 — 방→문→벽 순 배치, 충돌 시 나선 탐색으로 빈 자리로 이동
     이동된 배지는 실제 위치에서 콜아웃(점+선)으로 가리킴.
     정적 데이터이므로 최초 1회만 계산하고 캐시.                          */
  var _badgeLayout = null;
  function computeBadgeLayout(){
    var arr = [];
    var n = 1;
    ROOMS.forEach(function(r){
      arr.push({cat:'room', n:n++, tx:mx((r[0]+r[2])/2), ty:mz((r[1]+r[3])/2),
                r:13, fontSz:14, bg:'#1a78d6', fg:'#fff'});
    });
    DOORS.forEach(function(d){
      arr.push({cat:'door', n:n++, tx:mx(d[0]), ty:mz(d[1]),
                r:11, fontSz:12, bg:'#f5c518', fg:'#000'});
    });
    FURNITURE.forEach(function(f){
      arr.push({cat:'furn', n:n++, tx:mx(f[0]), ty:mz(f[1]),
                r:10, fontSz:11, bg:'#3aa856', fg:'#fff'});
    });
    WALLS.forEach(function(w){
      arr.push({cat:'wall', n:n++, tx:mx((w[0]+w[2])/2), ty:mz((w[1]+w[3])/2),
                r:9,  fontSz:11, bg:'#d6311a', fg:'#fff'});
    });
    WINDOWS.forEach(function(wn){
      arr.push({cat:'win', n:n++, tx:mx(wn[0]), ty:mz(wn[1]),
                r:10, fontSz:11, bg:'#00a8c8', fg:'#fff'});
    });

    // 자리 검색 함수 — placed 배열의 어떤 배지와도 안 겹치고 캔버스 내부면 OK
    var pad = 2;  // 배지 간 여유
    function fits(b, x, y, placed){
      if (x - b.r < 1 || x + b.r > CW - 1) return false;
      if (y - b.r < 1 || y + b.r > CH2 - 1) return false;
      for (var i=0; i<placed.length; i++){
        var o = placed[i];
        var dx = x - o.bx, dy = y - o.by;
        var minD = b.r + o.r + pad;
        if (dx*dx + dy*dy < minD*minD) return false;
      }
      return true;
    }

    var placed = [];
    arr.forEach(function(b){
      // 1) 실제 위치에 빈 자리면 그대로
      if (fits(b, b.tx, b.ty, placed)){
        b.bx = b.tx; b.by = b.ty;
        placed.push(b);
        return;
      }
      // 2) 나선 탐색 — 점점 큰 반경으로 8 링까지 시도
      var step = b.r * 1.25;
      for (var ring = 1; ring <= 12; ring++){
        var R = ring * step;
        var samples = Math.max(8, 6 * ring);
        for (var k = 0; k < samples; k++){
          var angle = (k / samples) * Math.PI * 2;
          var x = b.tx + Math.cos(angle) * R;
          var y = b.ty + Math.sin(angle) * R;
          if (fits(b, x, y, placed)){
            b.bx = x; b.by = y;
            placed.push(b);
            return;
          }
        }
      }
      // 3) 못 찾으면 실제 위치 그대로 (overlap 발생할 수 있음)
      b.bx = b.tx; b.by = b.ty;
      placed.push(b);
    });
    return arr;
  }

  /* ─────────────────────────────────────────────────────────────────
     Hover-spread (사용자 요청)
     마우스 커서가 미니맵 위에 있을 때, 그 주변 HOVER_R 안의 실제 위치
     (`tx,ty`) 를 갖는 배지들을 마우스 주변 원 위에 균등 분포로 펼쳐
     리더 라인으로 실제 위치를 가리키게 함 — 어느 번호가 무엇을 가리키는지
     즉시 식별 가능. _mouseX/_mouseY 는 모듈 스코프에서 window mousemove
     로 추적 중이며, minimap 캔버스는 pointer-events:none 이므로
     getBoundingClientRect 로 화면 좌표 ↔ 캔버스 내부 좌표 변환.

     hover 가 활성일 때만 spread 배지가 펼쳐지고, 그 외 배지들은 기본
     spiral 레이아웃 그대로 유지.
  ─────────────────────────────────────────────────────────────────── */
  var HOVER_R         = 36;   // px — 실제 위치(tx,ty) 가 이 안에 있으면 spread 대상
  var EXPLODE_R_BASE  = 64;   // px — spread 배지를 마우스 주변 원에 배치하는 기본 반경
  var EXPLODE_R_PER   = 5;    // px — 항목 5 개 초과 시 1 개당 반경 추가

  function _getMinimapHover(){
    var rect = mc.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    if (_mouseX < rect.left || _mouseX > rect.right) return null;
    if (_mouseY < rect.top  || _mouseY > rect.bottom) return null;
    return {
      x: (_mouseX - rect.left) * (CW  / rect.width),
      y: (_mouseY - rect.top)  * (CH2 / rect.height),
    };
  }

  function drawNumberOverlay(c) {
    if (!_badgeLayout) _badgeLayout = computeBadgeLayout();

    // PP/미팅 모드: 미니맵에는 벽 번호만 표시 (사용자 요청). 그 외 (방·문·가구·창문) 배지 모두 숨김.
    // (CL 50995: powerPlanMode → _outletViewActive — PP 와 미팅 양 모드 공통.)
    var ppm = !!window._outletViewActive;
    var ppFilter = function(b){ return ppm ? (b.cat === 'wall') : true; };

    // 0) hover 대상 배지 분류 — 실제 위치(tx,ty) 또는 배치 위치(bx,by)
    //    가 hover 점 R 안에 있는 것. 두 위치 모두 고려해야 함:
    //      · 실제 위치만 고려: 배지가 spiral 로 멀리 이동했을 때 시각 클러스터를
    //        놓침 (사용자는 보이는 번호 더미를 hover 했는데 spread 안 됨).
    //      · 배치 위치만 고려: 사용자가 평면도 영역(빈 공간)을 hover 했을 때
    //        그곳에 있는 가구를 못 잡음.
    //      → min(d_real, d_drawn) ≤ R 이면 포함.
    var hover = _getMinimapHover();
    var spreadList = [];
    var inSpread   = {};   // key: b.n → true
    if (hover) {
      var R2 = HOVER_R * HOVER_R;
      _badgeLayout.forEach(function(b){
        if (!ppFilter(b)) return;
        var dx1 = b.tx - hover.x, dy1 = b.ty - hover.y;
        var dx2 = b.bx - hover.x, dy2 = b.by - hover.y;
        var d1 = dx1*dx1 + dy1*dy1;
        var d2 = dx2*dx2 + dy2*dy2;
        if (Math.min(d1, d2) <= R2) {
          spreadList.push(b);
          inSpread[b.n] = true;
        }
      });
    }

    // 1) 일반(spread 아님) 배지 — 기존 콜아웃 (실제 위치 점 + 연결선)
    _badgeLayout.forEach(function(b){
      if (!ppFilter(b)) return;
      if (inSpread[b.n]) return;
      var dx = b.bx - b.tx, dy = b.by - b.ty;
      var d = Math.sqrt(dx*dx + dy*dy);
      if (d <= b.r + 1) return; // 거의 안 움직였으면 콜아웃 생략

      var ux = dx/d, uy = dy/d;
      // 연결선 (실제 위치 → 배지 가장자리)
      c.beginPath();
      c.moveTo(b.tx, b.ty);
      c.lineTo(b.bx - ux*b.r, b.by - uy*b.r);
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 1;
      c.stroke();

      // 실제 위치 점 (배지 색상)
      c.beginPath();
      c.arc(b.tx, b.ty, 2.2, 0, Math.PI*2);
      c.fillStyle = b.bg;
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 0.6;
      c.stroke();
    });

    // 2) 일반 배지 본체 (이동된 위치)
    _badgeLayout.forEach(function(b){
      if (!ppFilter(b)) return;
      if (inSpread[b.n]) return;
      drawBadge(c, b.bx, b.by, b.n, b.bg, b.fg, b.r, b.fontSz);
    });

    // 3) Hover spread — 마우스 주변 원 위에 펼침 + 리더 라인
    if (hover && spreadList.length > 0) {
      // 호버 가이드 원 (점선)
      c.save();
      c.beginPath();
      c.arc(hover.x, hover.y, HOVER_R, 0, Math.PI*2);
      c.strokeStyle = 'rgba(255,255,255,0.28)';
      c.lineWidth = 1;
      c.setLineDash([3, 3]);
      c.stroke();
      c.restore();

      // 정렬 — 호버 중심 기준 각도 (실제 위치)
      spreadList.forEach(function(b){
        var dx = b.tx - hover.x, dy = b.ty - hover.y;
        b._angle = (dx === 0 && dy === 0) ? 0 : Math.atan2(dy, dx);
      });
      spreadList.sort(function(a, b){ return a._angle - b._angle; });

      // 원형 배치 — 항목이 많을수록 반경 늘림 (단일은 살짝 위로)
      var n = spreadList.length;
      var expR = EXPLODE_R_BASE + Math.max(0, n - 5) * EXPLODE_R_PER;
      var maxBR = 0;
      spreadList.forEach(function(b){ if (b.r + 2 > maxBR) maxBR = b.r + 2; });

      if (n === 1) {
        // 단일 항목: 실제 위치 위쪽으로 살짝 띄움
        var only = spreadList[0];
        only._sx = hover.x;
        only._sy = hover.y - expR;
      } else {
        // 첫 항목의 실제 각도를 anchor 로 — 회전 일관성 유지
        var anchorA = spreadList[0]._angle;
        spreadList.forEach(function(b, i){
          var a = anchorA + (i * 2 * Math.PI / n);
          b._sx = hover.x + Math.cos(a) * expR;
          b._sy = hover.y + Math.sin(a) * expR;
        });
      }
      // 캔버스 경계 안으로 클램프
      spreadList.forEach(function(b){
        b._sx = Math.max(maxBR + 1, Math.min(CW  - maxBR - 1, b._sx));
        b._sy = Math.max(maxBR + 1, Math.min(CH2 - maxBR - 1, b._sy));
      });

      // 리더 라인 — 실제 위치 → 펼친 위치 (배지 가장자리에 정확히 닿도록)
      spreadList.forEach(function(b){
        var dx = b._sx - b.tx, dy = b._sy - b.ty;
        var d = Math.sqrt(dx*dx + dy*dy) || 1;
        var ux = dx/d, uy = dy/d;
        var rEdge = b.r + 2; // spread 배지는 +2 확대
        c.beginPath();
        c.moveTo(b.tx, b.ty);
        c.lineTo(b._sx - ux*rEdge, b._sy - uy*rEdge);
        c.strokeStyle = 'rgba(255,255,255,0.95)';
        c.lineWidth = 1.4;
        c.stroke();
      });
      // 실제 위치 점 — 배지 색상, 하이라이트
      spreadList.forEach(function(b){
        c.beginPath();
        c.arc(b.tx, b.ty, 3.2, 0, Math.PI*2);
        c.fillStyle = b.bg;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.0;
        c.stroke();
      });
      // 펼친 배지 본체 — +2 확대해 가독성 ↑
      spreadList.forEach(function(b){
        drawBadge(c, b._sx, b._sy, b.n, b.bg, b.fg, b.r + 2, b.fontSz + 1);
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     자기검증 어셔션 (항목 M)
     미니맵 데이터 배열과 3D 빌더가 한 곳을 잊고 동기 안 되면 SHIFT
     조준 라벨이 잘못된 객체를 가리킨다. 초기화 1회 검사로 콘솔에
     즉시 경고 — 동작 비변경, 비용 거의 0.
  ─────────────────────────────────────────────────────────────────── */
  console.assert(_doors.length === DOORS.length,
    '[M] _doors.length(' + _doors.length + ') !== DOORS.length(' + DOORS.length + ')');
  console.assert(FURNITURE.length === FURNITURE_BBOX.length,
    '[M] FURNITURE.length(' + FURNITURE.length + ') !== FURNITURE_BBOX.length(' + FURNITURE_BBOX.length + ')');
  console.assert(WINDOWS.length === WINDOWS_BBOX.length,
    '[M] WINDOWS.length(' + WINDOWS.length + ') !== WINDOWS_BBOX.length(' + WINDOWS_BBOX.length + ')');
  ROOMS.forEach(function(r, i){
    console.assert(r[0] < r[2] && r[1] < r[3],
      '[M] ROOMS[' + i + '] 좌표 역전 또는 zero-area: ' + JSON.stringify(r.slice(0,4)));
  });
  WALLS.forEach(function(w, i){
    console.assert(w[0] !== w[2] || w[1] !== w[3],
      '[M] WALLS[' + i + '] zero-length 세그먼트: ' + JSON.stringify(w));
  });
  FURNITURE_BBOX.forEach(function(b, i){
    console.assert(b[0] < b[2] && b[1] < b[3],
      '[M] FURNITURE_BBOX[' + i + '] 좌표 역전: ' + JSON.stringify(b.slice(0,4)));
    if (b.length >= 6) {
      console.assert(b[4] < b[5],
        '[M] FURNITURE_BBOX[' + i + '] y 범위 역전: ' + b[4] + '~' + b[5]);
    }
  });
  WINDOWS_BBOX.forEach(function(b, i){
    console.assert(b[0] <= b[2] && b[1] <= b[3],
      '[M] WINDOWS_BBOX[' + i + '] 좌표 역전: ' + JSON.stringify(b));
  });

  /* ─────────────────────────────────────────────────────────────────
     defineFurniture spec ↔ FURNITURE[]/FURNITURE_BBOX[] 일관성 검사 (항목 P)
     FURN_REGISTRY 는 K 항목에서 도입된 데이터-중심 가구 정의의 메타
     레지스트리. 마이그레이션된 가구는 spec.id 가 글로벌 @FURN#NN 과
     일치해야 하며, 미니맵 배열의 FURNITURE[id-47]/FURNITURE_BBOX[id-47]
     항목과 위치/이름/bbox 가 일치해야 함. 어긋나면 어셔션 실패 → 콘솔
     경고. 새 가구 추가 시 defineFurniture 만 쓰면 부수 등록이 일관되게
     맞춰짐.
  ─────────────────────────────────────────────────────────────────── */
  if (typeof FURN_REGISTRY !== 'undefined') {
    FURN_REGISTRY.forEach(function(spec){
      if (typeof spec.id !== 'number') return;
      var idx = spec.id - 47;
      if (idx < 0 || idx >= FURNITURE.length) {
        console.assert(false,
          '[P] FURN_REGISTRY id=' + spec.id + ' 가 FURNITURE[] 범위 밖');
        return;
      }
      var f = FURNITURE[idx];
      console.assert(f && f[2] === spec.name,
        '[P] FURN#' + spec.id + ' 이름 불일치: spec="' + spec.name +
        '" vs FURNITURE[' + idx + '][2]="' + (f && f[2]) + '"');
      if (spec.bbox) {
        var b = FURNITURE_BBOX[idx];
        console.assert(b && b[0]===spec.bbox[0] && b[1]===spec.bbox[1]
                          && b[2]===spec.bbox[2] && b[3]===spec.bbox[3],
          '[P] FURN#' + spec.id + ' bbox 불일치: spec=' + JSON.stringify(spec.bbox) +
          ' vs FURNITURE_BBOX[' + idx + ']=' + JSON.stringify(b && b.slice(0,4)));
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     FURN_META ↔ FURNITURE[] / FURNITURE_BBOX[] 일관성 검사 (항목 U)
     FURN_META 의 28 개 항목 모두 미니맵 배열과 일치해야 함. spec.bbox 의
     처음 4 요소(xz)·name 비교. 인덱스 = id - 47.
  ─────────────────────────────────────────────────────────────────── */
  if (typeof FURN_META !== 'undefined') {
    Object.keys(FURN_META).forEach(function(k){
      var m = FURN_META[k];
      var idx = m.id - 47;
      if (idx < 0 || idx >= FURNITURE.length) {
        console.assert(false, '[U] FURN_META id=' + m.id + ' 가 FURNITURE[] 범위 밖');
        return;
      }
      var f = FURNITURE[idx];
      console.assert(f && f[2] === m.name,
        '[U] FURN#' + m.id + ' name 불일치: meta="' + m.name +
        '" vs FURNITURE[' + idx + '][2]="' + (f && f[2]) + '"');
      var b = FURNITURE_BBOX[idx];
      console.assert(b && b[0]===m.bbox[0] && b[1]===m.bbox[1]
                        && b[2]===m.bbox[2] && b[3]===m.bbox[3],
        '[U] FURN#' + m.id + ' bbox 불일치: meta=' + JSON.stringify(m.bbox.slice(0,4)) +
        ' vs FURNITURE_BBOX[' + idx + ']=' + JSON.stringify(b && b.slice(0,4)));
    });
    // FURN_META 가 28개 모두 채워졌는지 (47..74)
    var metaIds = Object.keys(FURN_META).map(Number).sort(function(a,b){return a-b;});
    console.assert(metaIds.length === FURNITURE.length,
      '[U] FURN_META 항목 수(' + metaIds.length + ') !== FURNITURE.length(' + FURNITURE.length + ')');
  }

  /* ─────────────────────────────────────────────────────────────────
     클리어런스/충돌 검사 (항목 CC)
     init time 1 회. 발견 시 console.warn — 동작 변경 0.
       1) 가구 ↔ 가구: xz 사각형 겹침 + (양쪽이 6-요소 bbox 인 경우) y 범위 겹침
       2) 가구 ↔ 벽 : 벽 세그먼트가 가구 bbox 의 5cm 인셋 안으로 침투
                       (벽에 붙은 가구는 무시)
  ─────────────────────────────────────────────────────────────────── */
  function _segVsSeg(x1,y1,x2,y2, x3,y3,x4,y4){
    var denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(denom) < 1e-9) return false;
    var t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom;
    var u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / denom;
    return t > 0 && t < 1 && u > 0 && u < 1;
  }
  function _segVsRect(x1, z1, x2, z2, rx1, rz1, rx2, rz2){
    var p1 = x1 >= rx1 && x1 <= rx2 && z1 >= rz1 && z1 <= rz2;
    var p2 = x2 >= rx1 && x2 <= rx2 && z2 >= rz1 && z2 <= rz2;
    if (p1 || p2) return true;
    return _segVsSeg(x1,z1,x2,z2, rx1,rz1, rx2,rz1) ||
           _segVsSeg(x1,z1,x2,z2, rx2,rz1, rx2,rz2) ||
           _segVsSeg(x1,z1,x2,z2, rx1,rz2, rx2,rz2) ||
           _segVsSeg(x1,z1,x2,z2, rx1,rz1, rx1,rz2);
  }

  // 1) 가구 ↔ 가구 겹침
  FURNITURE_BBOX.forEach(function(b1, i){
    for (var j = i + 1; j < FURNITURE_BBOX.length; j++){
      var b2 = FURNITURE_BBOX[j];
      var xOver = b1[0] < b2[2] - 0.005 && b2[0] < b1[2] - 0.005;
      var zOver = b1[1] < b2[3] - 0.005 && b2[1] < b1[3] - 0.005;
      if (!(xOver && zOver)) continue;
      var yOver = true;
      if (b1.length >= 6 && b2.length >= 6){
        yOver = b1[4] < b2[5] - 0.005 && b2[4] < b1[5] - 0.005;
      }
      if (yOver){
        console.warn('[CC] FURN#' + (i+47) + ' (' + FURNITURE[i][2] +
                     ') ↔ FURN#' + (j+47) + ' (' + FURNITURE[j][2] + ') 겹침');
      }
    }
  });
  // 2) 가구 ↔ 벽 침투 (5cm 인셋)
  FURNITURE_BBOX.forEach(function(b, i){
    var inset = 0.05;
    var rx1 = b[0]+inset, rz1 = b[1]+inset, rx2 = b[2]-inset, rz2 = b[3]-inset;
    if (rx2 - rx1 < 0.02 || rz2 - rz1 < 0.02) return;   // 너무 작은 가구는 검사 생략
    WALLS.forEach(function(w, k){
      if (_segVsRect(w[0], w[1], w[2], w[3], rx1, rz1, rx2, rz2)){
        var wallId = ROOMS.length + DOORS.length + FURNITURE.length + k + 1;
        console.warn('[CC] FURN#' + (i+47) + ' (' + FURNITURE[i][2] +
                     ') 가 WALL#' + wallId + ' 침투: WALL=' + JSON.stringify(w));
      }
    });
  });

  /* ─────────────────────────────────────────────────────────────────
     콘솔 인스펙터 헬퍼 (항목 Z)
     브라우저 콘솔에서 가구/방/충돌 정보를 즉시 조회. SHIFT-aim 의
     시각 라벨과 별개로, '@FURN#48 깊이는 정확히 몇 cm' / '침대와
     벽 사이 간격' 같은 정량 질의에 답할 때 사용.

     사용 예 (브라우저 콘솔):
       _inspect(48)              // FURN_META[48] 전체
       _inspect('FURN#48')       // 같음 (문자열도 허용)
       _gap(48, 49)              // 침대 ↔ 책상 xz 클리어런스
       _listRoom('욕실')         // 욕실 가구 목록
       _listRoom('서재')
  ─────────────────────────────────────────────────────────────────── */
  function _resolveFurnId(ref){
    if (typeof ref === 'number') return ref;
    if (typeof ref === 'string'){
      var m = ref.match(/(\d+)/);
      if (m) return +m[1];
    }
    return null;
  }
  window._inspect = function(ref){
    if (typeof FURN_META === 'undefined') {
      console.warn('FURN_META 가 로드 안 됨'); return null;
    }
    var id = _resolveFurnId(ref);
    var m = id != null ? FURN_META[id] : null;
    if (!m){ console.warn('알 수 없는 가구 참조: ' + ref); return null; }
    var bbox = m.bbox;
    var info = {
      id: m.id, name: m.name, room: m.room,
      pos:  m.pos,
      size: { W: m.size.W, D: m.size.D, H: m.size.H,
              W_cm: Math.round(m.size.W*100),
              D_cm: Math.round(m.size.D*100),
              H_cm: Math.round(m.size.H*100) },
      bbox_xz: bbox.slice(0, 4),
      bbox_y:  bbox.length >= 6 ? [bbox[4], bbox[5]] : null,
      source:  m.source || null,
    };
    return info;
  };
  window._gap = function(refA, refB){
    if (typeof FURN_META === 'undefined') return null;
    var a = FURN_META[_resolveFurnId(refA)];
    var b = FURN_META[_resolveFurnId(refB)];
    if (!a || !b){ console.warn('알 수 없는 참조: ' + refA + ', ' + refB); return null; }
    var dx = Math.max(a.bbox[0] - b.bbox[2], b.bbox[0] - a.bbox[2], 0);
    var dz = Math.max(a.bbox[1] - b.bbox[3], b.bbox[1] - a.bbox[3], 0);
    return {
      a: '@FURN#' + a.id + ' ' + a.name,
      b: '@FURN#' + b.id + ' ' + b.name,
      gap_x_cm: Math.round(dx * 100),
      gap_z_cm: Math.round(dz * 100),
      // 두 BBox 가 겹치면 dx=dz=0 → "겹침" 가능
      overlap: (dx === 0 && dz === 0),
    };
  };
  window._listRoom = function(roomName){
    if (typeof FURN_META === 'undefined') return null;
    var items = Object.keys(FURN_META).map(function(k){ return FURN_META[k]; })
                    .filter(function(m){ return m.room === roomName; });
    return {
      room: roomName,
      count: items.length,
      furniture: items.map(function(m){
        return '@FURN#' + m.id + ' ' + m.name +
               ' (W' + Math.round(m.size.W*100) +
               ' × D' + Math.round(m.size.D*100) +
               ' × H' + Math.round(m.size.H*100) + ' cm)';
      }),
    };
  };

  // expose so animate() can call it
  window._drawMinimap = drawMinimap;
  // 디버그 모드(항목 S)에서 미니맵 데이터 배열들을 외부에서 접근 가능하게 노출.
  if (location.search.indexOf('debug') !== -1) {
    window._mmData = { ROOMS:ROOMS, WALLS:WALLS, DOORS:DOORS,
                       FURNITURE:FURNITURE, FURNITURE_BBOX:FURNITURE_BBOX,
                       WINDOWS:WINDOWS, WINDOWS_BBOX:WINDOWS_BBOX };
  }
})();
