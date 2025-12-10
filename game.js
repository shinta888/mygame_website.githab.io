// game.js （type="module" 前提）

// --- Firebase 初期化 ---------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbdkGsWniVFjBj9iAa3KzP1psUDSb4rho",
  authDomain: "shintarogame-c7f21.firebaseapp.com",
  databaseURL:"https://shintarogame-c7f21-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shintarogame-c7f21",
  storageBucket: "shintarogame-c7f21.appspot.com",
  messagingSenderId: "459244112734",
  appId: "1:459244112734:web:e3f6ee815b3e34950dddcf"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ランキングにスコアを追加
async function saveScoreToServer(name, score){
  const rankRef = ref(db, "ranking");
  await push(rankRef, {
    name,
    score,
    time: Date.now()
  });
}

// --- ゲーム共通変数 ---------------------------------------
let score = 0;
let timeLeft = 60;

const scoreEl  = document.getElementById('score');
const secEl    = document.getElementById('sec');
const sceneEl  = document.getElementById('scene');
const leadEl   = document.getElementById('lead');
const controls = document.getElementById('controls');

const stepBadge = document.getElementById('step-badge'); //分岐点バッチ
let stepCount = 0; 

function updateStepBadge(){ //バッチカウント
  if (!stepBadge) return;
  if (stepCount <= 0){
    stepBadge.style.display = 'none';
    stepBadge.textContent = '';
    return;
  }
  stepBadge.style.display = 'flex';
  const base = 0x2460; // ①
  if (stepCount >= 1 && stepCount <= 20){
    stepBadge.textContent = String.fromCharCode(base + stepCount - 1);
  } else {
    stepBadge.textContent = String(stepCount);
  }
}


let mode = 'explore'; // 'explore' | 'return'
let history = [];     // 記録: {dir, idx, kind}
let backIndex = -1;

// --- 画像プリロード ---------------------------------------
const imageCache = {};
const preloadUrls = [];

// 探索用画像（進行）
for (let i = 1; i <= 32; i++) {
  preloadUrls.push(`images/left${i}.jpg`);
  preloadUrls.push(`images/right${i}.jpg`);
}
for (let i = 1; i <= 16; i++) {
  preloadUrls.push(`images/forward${i}.jpg`);
}

// 帰り道用画像（images2/turning a..h 1..4）
const letters = ['a','b','c','d','e','f','g','h'];
for (const l of letters) {
  for (let k = 1; k <= 4; k++) {
    preloadUrls.push(`images2/turning${l}${k}.jpg`);
  }
}

// 特殊画像
preloadUrls.push('images/start.jpeg');
preloadUrls.push('images/goal.jpeg');
preloadUrls.push('images/mayotta.jpeg');

// 実際にプリロード
preloadUrls.forEach(url => {
  const img = new Image();
  img.onload = () => {
    imageCache[url] = img;
  };
  img.src = url;
});

// 表示用ヘルパー
function setScene(src) {
  if (imageCache[src]) {
    sceneEl.src = imageCache[src].src;
  } else {
    sceneEl.src = src;
  }
}

// --- タイマー ----------------------------------------------
const timer = setInterval(() => {
  timeLeft = Math.max(0, timeLeft - 1);
  secEl.textContent = String(timeLeft);
  if (timeLeft === 0) {
    clearInterval(timer);
    showLostThenGameOver(); // タイムアップは迷子扱い
  }
}, 1000);

// --- ボタン描画 --------------------------------------------
function renderExploreControls(){
  controls.innerHTML = '';
  const go = document.createElement('button');
  go.className='btn';
  go.textContent='進む！';
  const back = document.createElement('button');
  back.className='btn';
  back.textContent='いや、引き返す';
  controls.append(go, back);
  go.addEventListener('click', showRandomSceneAndScore);
  back.addEventListener('click', startReturnMode);
}

function renderReturnControls(kind, correct){
  controls.innerHTML = '';
  const addBtn = (val, label) => {
    const b = document.createElement('button');
    b.className='btn';
    b.textContent = label;
    b.addEventListener('click', ()=> checkReturnAnswer(val, correct));
    controls.appendChild(b);
  };
  if (kind==='two'){
    addBtn('left','左？');
    addBtn('right','右？');
  } else {
    addBtn('left','左？');
    addBtn('forward','真っ直ぐ？');
    addBtn('right','右？');
  }
}

// --- 進行中の画像抽選 --------------------------------------
function randomScene(){
  if (Math.random() < 0.8) { // left/right 80%
    const dir = Math.random() < 0.5 ? 'left' : 'right';
    const idx = Math.floor(Math.random()*32)+1;
    const kind = idx <= 16 ? 'three' : 'two'; // 1〜16: 三方向, 17〜32: 双方向
    return {file:`images/${dir}${idx}.jpg`, meta:{dir, idx, kind}};
  } else { // forward 20%
    const idx = Math.floor(Math.random()*16)+1;
    return {file:`images/forward${idx}.jpg`, meta:{dir:'forward', idx, kind:'three'}};
  }
}

// --- 宝箱スコア計算 ----------------------------------------
function chestPointsByFilename(name){
  const m = name.match(/(\d+)\.jpg$/);
  if(!m) return 0;
  const n = parseInt(m[1],10);
  const mod = n % 4;
  if(mod===2) return 1; // 銅
  if(mod===3) return 2; // 銀
  if(mod===0) return 3; // 金
  return 0;             // なし
}


// --- 進む処理 ----------------------------------------------
function showRandomSceneAndScore(){
  if(timeLeft<=0 || mode!=='explore') return;
  stepCount++;        // 分岐ごとにカウント
  updateStepBadge();  // 表示更新 
  const pick = randomScene();
  setScene(pick.file);
  history.push(pick.meta);

  const add = chestPointsByFilename(pick.file);
  if(add>0){
    score += add;
    scoreEl.textContent = String(score);
    leadEl.innerHTML = 'お宝発見！！<br>だが、まだまだありそうだ';
  } else {
    leadEl.textContent = 'この先にお宝の匂い！！';
  }
}

// --- 帰り道モード ------------------------------------------
function startReturnMode() {
   // ★ 帰路に入るのでバッジリセット
  stepCount = 0;
  updateStepBadge();

  // 一度も進んでいない → 入口なので即ゴール
  if (history.length === 0) {
    clearInterval(timer);
    showGoalThenResult();
    return;
  }

  // 最後に表示された分岐点は「まだ進んでいない」ので削除
  history.pop();

  // 一歩だけ進んで引き返した → 残り履歴なし
  if (history.length === 0) {
    clearInterval(timer);
    showGoalThenResult();
    return;
  }

  mode = "return";
  backIndex = history.length - 1;
  askAtCurrentBackStep();
}

function askAtCurrentBackStep(){
  const step = history[backIndex];
  const turnImg = turningImageFor(step.idx);
  leadEl.textContent = step.kind==='two'
    ? 'どっちから来た？'
    : 'どの道から来た？';
  setScene(turnImg);

  let correct = step.dir;
  if (step.dir==='left')  correct = 'right';
  else if (step.dir==='right') correct = 'left';
  renderReturnControls(step.kind, correct);
}

function checkReturnAnswer(choice, correct){
  if (choice === correct){
    backIndex--;
    if (backIndex < 0){
      clearInterval(timer);
      showGoalThenResult();
    } else {
      askAtCurrentBackStep();
    }
  } else {
    clearInterval(timer);
    showLostThenGameOver();
  }
}

// --- 帰り道画像対応 ----------------------------------------
function turningImageFor(idx){
  const group = (n)=>{
    if (n>=1  && n<=4 ) return ['a',(n-1 )%4+1];
    if (n>=5  && n<=8 ) return ['b',(n-5 )%4+1];
    if (n>=9  && n<=12) return ['c',(n-9 )%4+1];
    if (n>=13 && n<=16) return ['d',(n-13)%4+1];
    if (n>=17 && n<=20) return ['e',(n-17)%4+1];
    if (n>=21 && n<=24) return ['f',(n-21)%4+1];
    if (n>=25 && n<=28) return ['g',(n-25)%4+1];
    if (n>=29 && n<=32) return ['h',(n-29)%4+1];
    return ['a',1];
  };
  const [g,k] = group(idx);
  return `images2/turning${g}${k}.jpg`;
}

// --- エンディング -----------------------------------------
function showGoalThenResult(){
  leadEl.textContent = '出口だ！！';
  setScene('images/goal.jpeg');
  controls.innerHTML='';
  setTimeout(()=> showResult(score), 3000);
}

function showLostThenGameOver(){
  leadEl.textContent = '迷った！！';
  setScene('images/mayotta.jpeg');
  controls.innerHTML='';
  setTimeout(()=> showGameOver(0), 3000);
}

function showResult(finalScore){
  let name = null;

  if (finalScore > 0) {
    name = window.prompt("ランキング登録！名前を入力してください（10文字まで）", "");
    if (name) {
      name = name.trim().slice(0,10);
      if (name) {
        // ランキング保存は「待たずに」投げるだけ
        saveScoreToServer(name, finalScore).catch(e => {
          console.error("ランキング保存に失敗:", e);
          // 失敗しても画面遷移はもう終わっているので OK
        });
      }
    }
  }
  document.body.innerHTML = `
    <main class="frame" style="text-align:center">
      <h1>Congratulations!!</h1>
      <div style="font-size:48px">
        <span style="color:red;font-weight:800">${finalScore}</span> ポイント ゲット！！
      </div>
      <div class="row" style="margin-top:32px">
        <a class="btn" href="./index.html">戻る</a>
      </div>
    </main>`;
}

function showGameOver(finalScore){
  document.body.innerHTML = `
    <main class="frame" style="text-align:center">
      <h1 style="color:red">Game Over!!</h1>
      <div style="font-size:48px">
        <span style="color:blue;font-weight:800">${finalScore}</span> ポイント
      </div>
      <div class="row" style="margin-top:32px">
        <a class="btn" href="./index.html">戻る</a>
      </div>
    </main>`;
}

// --- 初期化 ------------------------------------------------
renderExploreControls();
showRandomSceneAndScore();
