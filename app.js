/* =========================
   Mushroom Simulation Viewer
   app.js (GitHub Pages 안정화 버전)
   - HEAD 검사 제거
   - 로딩/버퍼링/재생 상태 표시
   - autoplay 실패 시 안내
   - 버튼(사용자 제스처) 기반 재생 확보
   - 동기화 기능
   - 선택 변경 시 비교영상 자동 갱신
========================= */

const base = "assets/videos";

// Players & status
const std = document.getElementById("stdPlayer");
const cmp = document.getElementById("cmpPlayer");
const stdStatus = document.getElementById("stdStatus");
const cmpStatus = document.getElementById("cmpStatus");

// Controls
const extrasSwitch = document.getElementById("extrasSwitch");
const comparePlay = document.getElementById("comparePlay");
const playBothBtn = document.getElementById("playBoth");
const pauseBothBtn = document.getElementById("pauseBoth");
const syncTimeBtn = document.getElementById("syncTime");

// Manual panel
const panel = document.getElementById("panel");
document.getElementById("openManual").onclick = () => panel.classList.add("open");
document.getElementById("closeManual").onclick = () => panel.classList.remove("open");

// State
let extrasOn = false;

// -------------------------
// Helpers
// -------------------------
function fileNameFromPath(path) {
  try {
    return decodeURIComponent(path.split("/").pop());
  } catch {
    return path.split("/").pop();
  }
}

function setStatus(el, msg) {
  if (el) el.textContent = msg;
}

async function ensurePlay(player) {
  try {
    player.muted = true; // autoplay 정책 대응
    player.setAttribute("playsinline", "");
    await player.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Load video to player with robust status updates.
 * - No HEAD check (GitHub Pages에서 HEAD 실패 케이스 방지)
 * - Use media events to show actual progress
 */
async function loadToPlayer(player, statusEl, path) {
  // 이벤트 핸들러 초기화(중복 방지)
  player.onwaiting = null;
  player.onstalled = null;
  player.oncanplay = null;
  player.onplaying = null;
  player.onerror = null;
  player.onloadedmetadata = null;
  player.onloadeddata = null;

  const fname = fileNameFromPath(path);
  setStatus(statusEl, `로딩 시작: ${fname}`);

  // 상태 이벤트들
  player.onloadedmetadata = () => setStatus(statusEl, `메타데이터 로드: ${fname}`);
  player.onloadeddata = () => setStatus(statusEl, `데이터 로드: ${fname}`);
  player.onwaiting = () => setStatus(statusEl, `버퍼링 중... (${fname})`);
  player.onstalled = () => setStatus(statusEl, `네트워크 지연(재시도 중)... (${fname})`);
  player.oncanplay = () => setStatus(statusEl, `재생 준비 완료: ${fname}`);
  player.onplaying = () => setStatus(statusEl, `재생 중: ${fname}`);
  player.onerror = () => {
    // 브라우저마다 오류 정보 접근이 제한될 수 있음
    setStatus(statusEl, `재생 실패(경로/파일 확인): ${path}`);
  };

  // 캐시 무효화 (최초 로딩 문제 줄이기)
  const url = path + (path.includes("?") ? "&" : "?") + "v=" + Date.now();

  // preload 정책: JS에서 강제하지 않지만, 안정적으로 로딩되도록 힌트는 줄 수 있음
  // player.preload = "metadata"; // 필요 시 켤 수 있음

  player.src = url;

  // autoplay 시도 (실패해도 버튼 재생으로 해결)
  const ok = await ensurePlay(player);
  if (!ok) {
    // 자동재생 차단 안내(사용자 클릭 유도)
    setStatus(statusEl, `자동재생이 차단됨 → 재생 버튼을 눌러주세요 (${fname})`);
  }
}

// -------------------------
// Video selection logic
// -------------------------
function buildComparePath() {
  let rel = "";

  if (extrasOn) {
    const q = document.getElementById("quality").value;
    const a = document.getElementById("aging").value;
    const s = document.getElementById("substrate").value;
    const t = document.getElementById("thinSolo").value;

    if (q !== "none") rel = `${base}/quality/${q}.mp4`;
    else if (a !== "none") rel = `${base}/aging/aging-${a}.mp4`;
    else if (s === "on") rel = `${base}/substrate/substrate_change.mp4`;
    else if (t !== "none") {
      if (t === "thinning_none") rel = `${base}/thinning/thinning_none.mp4`;
      else rel = `${base}/thinning/thinning_${t}.mp4`;
    } else {
      // 아무것도 선택 안 했을 때 안내용으로 표준과 동일하게 둘 수도 있음
      rel = `${base}/mushroom_S1T18_H90_Lon_S2T15_H80_Lon_T10.mp4`;
    }
  } else {
    const s1t = document.getElementById("s1temp").value;
    const s1l = document.getElementById("s1light").value;
    const s2t = document.getElementById("s2temp").value;
    const s2l = document.getElementById("s2light").value;
    const s2h = document.getElementById("s2hum").value;

    rel = `${base}/mushroom_S1T${s1t}_H90_L${s1l}_S2T${s2t}_H${s2h}_L${s2l}_T10.mp4`;
  }

  return rel;
}

async function updateCompare() {
  const path = buildComparePath();
  await loadToPlayer(cmp, cmpStatus, path);
}

async function loadStandard() {
  const path = `${base}/mushroom_S1T18_H90_Lon_S2T15_H80_Lon_T10.mp4`;
  await loadToPlayer(std, stdStatus, path);
}

// -------------------------
// UI wiring
// -------------------------

// 탭 전환
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tabpage").forEach((p) => (p.style.display = "none"));
    document.getElementById(btn.dataset.tab).style.display = "block";
  });
});

// 추가보기 스위치
extrasSwitch.addEventListener("change", () => {
  extrasOn = extrasSwitch.checked;
  updateCompare();
});

// 선택 변경 시 비교영상 자동 갱신(UX 개선)
document.querySelectorAll("select").forEach((sel) => {
  sel.addEventListener("change", () => {
    // extrasOn 상태에 상관없이 변경 즉시 비교영상 업데이트
    updateCompare();
  });
});

// 비교 재생 버튼: 비교영상 갱신 후, 두 영상 모두 재생 시도(사용자 클릭이라 성공률 높음)
comparePlay.addEventListener("click", async () => {
  await updateCompare();
  await ensurePlay(std);
  await ensurePlay(cmp);
});

// 둘다 재생/정지
if (playBothBtn) {
  playBothBtn.addEventListener("click", async () => {
    const okStd = await ensurePlay(std);
    const okCmp = await ensurePlay(cmp);
    if (!okStd) setStatus(stdStatus, "재생 실패 → 플레이어의 ▶ 버튼을 눌러주세요");
    if (!okCmp) setStatus(cmpStatus, "재생 실패 → 플레이어의 ▶ 버튼을 눌러주세요");
  });
}

if (pauseBothBtn) {
  pauseBothBtn.addEventListener("click", () => {
    try { std.pause(); } catch {}
    try { cmp.pause(); } catch {}
    setStatus(stdStatus, "일시정지");
    setStatus(cmpStatus, "일시정지");
  });
}

// 동기화: 비교 플레이어 시간을 표준 플레이어에 맞춤
if (syncTimeBtn) {
  syncTimeBtn.addEventListener("click", () => {
    try {
      // cmp 시간을 std로 맞추는 방식(원하면 반대로 바꿀 수 있음)
      cmp.currentTime = std.currentTime;
      setStatus(cmpStatus, `동기화 완료: ${std.currentTime.toFixed(1)}s`);
    } catch {
      setStatus(cmpStatus, "동기화 실패");
    }
  });
}

// -------------------------
// Init
// -------------------------
(async () => {
  // 표준 영상 로드
  await loadStandard();
  // 비교 영상 로드
  await updateCompare();
})();
