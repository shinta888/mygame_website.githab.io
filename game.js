let score = 0;
let timeLeft = 60;
const scoreEl = document.getElementById('score');
const secEl = document.getElementById('sec');
const sceneEl = document.getElementById('scene');
const leadEl  = document.getElementById('lead');
const controls = document.getElementById('controls');

let mode = 'explore'; // 'explore' | 'return'
let history = []; // 記録: {dir, idx, kind}

// ---- タイマー ----
const timer = setInterval(() => {
  timeLeft = Math.max(0, timeLeft - 1);
  secEl.textContent = String(timeLeft);
  if (timeLeft === 0) {
    clearInterval(timer);
    showLostThenGameOver(); // タイムアップは迷子扱い
  }
}, 1000);

// ---- 進行用ボタン ----
function renderExploreControls(){
  controls.innerHTML = '';
  const go = document.createElement('button');
  go.className='btn'; go.textContent='進む！';
  const back = document.createElement('button');
  back.className='btn'; back.textContent='いや、引き返す';
  controls.append(go, back);
  go.addEventListener('click', showRandomSceneAndScore);
  back.addEventListener('click', startReturnMode);
}

// ---- 帰り道ボタン ----
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
    addBtn('left','左？'); addBtn('right','右？');
  } else {
    addBtn('left','左？'); addBtn('forward','真っ直ぐ？'); addBtn('right','右？');
  }
}

// ---- 進行中の画像抽選 ----
function randomScene(){
  if (Math.random() < 0.8) { // left/right 80%
    const dir = Math.random() < 0.5 ? 'left' : 'right';
    const idx = Math.floor(Math.random()*32)+1;
    const kind = idx <= 16 ? 'three' : 'two';
    return {file:`images/${dir}${idx}.jpg`, meta:{dir, idx, kind}};
  } else { // forward 20%
    const idx = Math.floor(Math.random()*16)+1;
    return {file:`images/forward${idx}.jpg`, meta:{dir:'forward', idx, kind:'three'}};
  }
}

// ---- 宝箱スコア ----
function chestPointsByFilename(name){
  const m = name.match(/(\d+)\.jpg$/);
  if(!m) return 0;
  const n = parseInt(m[1],10);
  const mod = n % 4;
  if(mod===2) return 1;
  if(mod===3) return 2;
  if(mod===0) return 3;
  return 0;
}

// ---- 進む処理 ----
function showRandomSceneAndScore(){
  if(timeLeft<=0 || mode!=='explore') return;
  const pick = randomScene();
  sceneEl.src = pick.file;
  history.push(pick.meta);
  const add = chestPointsByFilename(pick.file);
  if(add>0){ score += add; scoreEl.textContent = String(score); }
}

// ---- 帰り道 ----
let backIndex = -1;
function startReturnMode(){
  if (history.length===0) return;
  mode = 'return';
  backIndex = history.length - 1;
  askAtCurrentBackStep();
}

function askAtCurrentBackStep(){
  const step = history[backIndex];
  const turnImg = turningImageFor(step.idx);
  leadEl.textContent = step.kind==='two' ? 'どっちから来た？' : 'どの道から来た？';
  sceneEl.src = turnImg;
  let correct = step.dir;
  if (step.dir==='left') correct = 'right';
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

// ---- 帰り道画像対応 ----
function turningImageFor(idx){
  const group = (n)=>{
    if (n>=1 && n<=4) return ['a',(n-1)%4+1];
    if (n>=5 && n<=8) return ['b',(n-5)%4+1];
    if (n>=9 && n<=12) return ['c',(n-9)%4+1];
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

// ---- エンディング ----
function showGoalThenResult(){
  leadEl.textContent = '出口だ！！';
  sceneEl.src = 'images/goal.jpeg';
  controls.innerHTML='';
  setTimeout(()=> showResult(score), 3000);
}

function showLostThenGameOver(){
  leadEl.textContent = '迷った！！';
  sceneEl.src = 'images/mayotta.jpeg';
  controls.innerHTML='';
  setTimeout(()=> showGameOver(0), 3000);
}

function showResult(finalScore){
  document.body.innerHTML = `
    <main class="frame" style="text-align:center">
      <h1>Congratulations!!</h1>
      <div style="font-size:48px"><span style="color:red;font-weight:800">${finalScore}</span> ポイント ゲット！！</div>
      <div class="row" style="margin-top:32px"><a class="btn" href="./index.html">戻る</a></div>
    </main>`;
}

function showGameOver(finalScore){
  document.body.innerHTML = `
    <main class="frame" style="text-align:center">
      <h1 style="color:red">Game Over!!</h1>
      <div style="font-size:48px"><span style="color:blue;font-weight:800">${finalScore}</span> ポイント</div>
      <div class="row" style="margin-top:32px"><a class="btn" href="./index.html">戻る</a></div>
    </main>`;
}

// 初期化
renderExploreControls();
showRandomSceneAndScore();
