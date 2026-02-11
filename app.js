const base="assets/videos";
const std=document.getElementById("stdPlayer");
const cmp=document.getElementById("cmpPlayer");
const stdStatus=document.getElementById("stdStatus");
const cmpStatus=document.getElementById("cmpStatus");
const extrasSwitch=document.getElementById("extrasSwitch");
const comparePlay = document.getElementById("comparePlay");

comparePlay.addEventListener("click", async ()=>{
  await updateCompare();
  await ensurePlay(std);
  await ensurePlay(cmp);
});

let extrasOn=false;

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tabpage").forEach(p=>p.style.display="none");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});

extrasSwitch.addEventListener("change",()=>{extrasOn=extrasSwitch.checked;updateCompare();});

const panel=document.getElementById("panel");
document.getElementById("openManual").onclick=()=>panel.classList.add("open");
document.getElementById("closeManual").onclick=()=>panel.classList.remove("open");

async function ensurePlay(p){
  try{ p.muted=true; p.setAttribute("playsinline",""); await p.play(); }
  catch{}
}

// ✅ GitHub Pages 안전: HEAD 검사 제거하고 무조건 src 세팅
async function loadToPlayer(player,status,path){
  status.textContent = "로딩 중: " + path.split('/').pop();

  player.onerror = () => {
    status.textContent = "재생 실패(경로/파일명 확인): " + path;
  };
  player.onloadeddata = () => {
    status.textContent = "로딩 완료: " + decodeURIComponent(path.split('/').pop());
  };

  player.src = path + "?v=" + Date.now();
  await ensurePlay(player);
  // 재생 중 표시는 loadeddata에서 처리됨
}

async function updateCompare(){
  let rel="";
  if(extrasOn){
    const q=document.getElementById("quality").value;
    const a=document.getElementById("aging").value;
    const s=document.getElementById("substrate").value;
    const t=document.getElementById("thinSolo").value;

    if(q!=="none") rel=`${base}/quality/${q}.mp4`;
    else if(a!=="none") rel=`${base}/aging/aging-${a}.mp4`;
    else if(s==="on") rel=`${base}/substrate/substrate_change.mp4`;
    else if(t!=="none"){
      if (t === "thinning_none") rel = `${base}/thinning/thinning_none.mp4`;
      else rel = `${base}/thinning/thinning_${t}.mp4`;
    }
  } else {
    const s1t=document.getElementById("s1temp").value;
    const s1l=document.getElementById("s1light").value;
    const s2t=document.getElementById("s2temp").value;
    const s2l=document.getElementById("s2light").value;
    const s2h=document.getElementById("s2hum").value;

    rel=`${base}/mushroom_S1T${s1t}_H90_L${s1l}_S2T${s2t}_H${s2h}_L${s2l}_T10.mp4`;
  }
  await loadToPlayer(cmp,cmpStatus,rel);
}

(async()=>{
  await loadToPlayer(std,stdStatus,`${base}/mushroom_S1T18_H90_Lon_S2T15_H80_Lon_T10.mp4`);
  await updateCompare();
})();
