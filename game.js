let score = 0;
let timeLeft = 60;
const scoreEl = document.getElementById('score');
const secEl = document.getElementById('sec');
const sceneEl = document.getElementById('scene');

// ---- Timer ----
const timer = setInterval(() => {
  timeLeft = Math.max(0, timeLeft - 1);
  secEl.textContent = String(timeLeft);
  if (timeLeft === 0) {
    clearInterval(timer);
    alert(`時間切れ！ スコア: ${score}`);
  }
}, 1000);

// ---- Image selection ----
// left/right の 1..16 は三方向分岐の「左/右」視点、17..32 は双方向分岐。
// 選択比率は left/right 合計 80%、forward 20%。
function randomScene(){
  if (Math.random() < 0.8) {        // 80%
    const dir = Math.random() < 0.5 ? 'left' : 'right';
    const idx = Math.floor(Math.random()*32)+1; // 1..32
    return `images/${dir}${idx}.jpg`;
  } else {                          // 20%
    const idx = Math.floor(Math.random()*16)+1; // 1..16
    return `images/forward${idx}.jpg`;
  }
}

// ---- Chest scoring ----
// 例: 銅は 2,6,10,...（4刻みで +1）
// → n % 4 === 2 で銅(+1), === 3 で銀(+2), === 0(≡4) で金(+3). === 1 は宝箱なし(0点)。
function chestPointsByFilename(name){
  const m = name.match(/(\d+)\.jpg$/);
  if(!m) return 0;
  const n = parseInt(m[1],10);
  const mod = n % 4;
  if(mod===2) return 1; // bronze
  if(mod===3) return 2; // silver
  if(mod===0) return 3; // gold (n=4,8,12,...)
  return 0;             // none (n=1,5,9,...)
}

function showRandomSceneAndScore(){
  if(timeLeft<=0) return;
  const file = randomScene();
  const img = new Image();
  img.onload = ()=>{ sceneEl.src = file; };
  img.onerror = ()=>{};
  img.src = file;

  const add = chestPointsByFilename(file);
  if(add>0){
    score += add;
    scoreEl.textContent = String(score);
  }
}

document.getElementById('go').addEventListener('click', showRandomSceneAndScore);
document.getElementById('back').addEventListener('click', ()=>{ window.location.href = './index.html'; });
showRandomSceneAndScore();