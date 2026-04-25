// --- Game State & Constants ---
const TARGET_SCORE = 3;
let playerScore = 0;
let cpuScore = 0;

let currentScene = 'selection';
let playerType = null;
let cpuType = null;
let playerPower = 0;
let cpuPower = 0;

// Stadium dimensions
const CANVAS_SIZE = 600;
const STADIUM_RADIUS = 280;
const CENTER_X = CANVAS_SIZE / 2;
const CENTER_Y = CANVAS_SIZE / 2;
const BEY_RADIUS = 20;

// Type Definitions
// weight: affects collision knockback
// speed: base movement speed
// stamina: rotation lifespan
// burstResist: how many hits it can take before bursting
// color: visual representation
const BEY_TYPES = {
    attack:   { weight: 1.0, speed: 8.0, stamina: 2400, burstResist: 12, color: '#ff3333' },
    defense:  { weight: 1.8, speed: 2.0, stamina: 3600, burstResist: 30, color: '#33cc33' },
    stamina:  { weight: 0.8, speed: 2.0, stamina: 6000, burstResist: 10,  color: '#ffff33' },
    balance:  { weight: 1.2, speed: 5.0, stamina: 3000, burstResist: 15, color: '#3388ff' }
};

// DOM Elements
const scenes = {
    selection: document.getElementById('scene-selection'),
    explanation: document.getElementById('scene-explanation'),
    shoot: document.getElementById('scene-shoot'),
    battle: document.getElementById('scene-battle'),
    result: document.getElementById('scene-result')
};
const scoreboard = document.getElementById('scoreboard');
const playerPointsEl = document.getElementById('player-points');
const cpuPointsEl = document.getElementById('cpu-points');
const powerBar = document.getElementById('power-bar');
const btnStartShoot = document.getElementById('btn-start-shoot');
const btnShoot = document.getElementById('btn-shoot');
const btnSpecialMove = document.getElementById('btn-special-move');
const btnDefense = document.getElementById('btn-defense');
const btnMove = document.getElementById('btn-move');
const btnFigure8 = document.getElementById('btn-figure8');
const canvas = document.getElementById('stadium');
const ctx = canvas.getContext('2d');
const battleMessage = document.getElementById('battle-message');
const messageText = document.getElementById('message-text');
const messageSubtext = document.getElementById('message-subtext');
const btnNextRound = document.getElementById('btn-next-round');
const resultTitle = document.getElementById('result-title');
const resultDetail = document.getElementById('result-detail');
const btnRestart = document.getElementById('btn-restart');

// Entities
let playerBey = null;
let cpuBey = null;
let animationId = null;
let isRoundEnding = false;

// --- Scene Management ---
function switchScene(sceneName) {
    Object.values(scenes).forEach(scene => scene.classList.add('hidden'));
    Object.values(scenes).forEach(scene => scene.classList.remove('active'));
    
    setTimeout(() => {
        scenes[sceneName].classList.remove('hidden');
        // small delay for css transition
        setTimeout(() => scenes[sceneName].classList.add('active'), 50);
    }, 300);
    currentScene = sceneName;

    if (sceneName === 'battle' || sceneName === 'shoot') {
        scoreboard.classList.remove('hidden');
    } else {
        scoreboard.classList.add('hidden');
    }
}

// --- Selection Phase ---
const typeExplanations = {
    attack: `
        <h2 style="color: #ff3333; margin-top: 0;">ATTACK TYPE SKILLS</h2>
        <ul style="text-align: left; line-height: 1.6; font-size: 1.1rem; color: #ddd; max-width: 600px; margin: 0 auto; list-style: none; padding: 0;">
            <li style="margin-bottom: 15px;"><strong style="color: #ffaa00; font-size: 1.2rem;">■ SPECIAL MOVE!</strong><br>1回のみ使用可能。相手に一直線に向かって超加速で突撃する必殺技！</li>
            <li style="margin-bottom: 15px;"><strong style="color: #00ffcc; font-size: 1.2rem;">■ DEFENSE!</strong><br>1回のみ使用可能。その場で踏ん張り、重量を上げて弾き飛ばされにくくなる。</li>
            <li style="margin-bottom: 15px;"><strong style="color: #ff3333; font-size: 1.2rem;">■ TARGET DASH!</strong><br>クールダウン後何度でも使用可能。相手の位置を正確に狙って高速で突進する！</li>
        </ul>
    `,
    defense: `
        <h2 style="color: #33cc33; margin-top: 0;">DEFENSE TYPE SKILLS</h2>
        <ul style="text-align: left; line-height: 1.6; font-size: 1.1rem; color: #ddd; max-width: 600px; margin: 0 auto; list-style: none; padding: 0;">
            <li style="margin-bottom: 15px;"><strong style="color: #ffaa00; font-size: 1.2rem;">■ SPECIAL MOVE!</strong><br>1回のみ使用可能。相手に一直線に向かって超加速で突撃する必殺技！</li>
            <li style="margin-bottom: 15px;"><strong style="color: #00ffcc; font-size: 1.2rem;">■ DEFENSE!</strong><br>1回のみ使用可能。その場で踏ん張り、重量を上げて弾き飛ばされにくくなる。</li>
            <li style="margin-bottom: 15px;"><strong style="color: #33cc33; font-size: 1.2rem;">■ QUICK TURN</strong><br>クールダウン後何度でも使用可能。ピンチの時にスタジアム中央へ向かって鋭く軌道修正する。</li>
        </ul>
    `,
    stamina: `
        <h2 style="color: #ffff33; margin-top: 0;">STAMINA TYPE SKILLS</h2>
        <ul style="text-align: left; line-height: 1.6; font-size: 1.1rem; color: #ddd; max-width: 600px; margin: 0 auto; list-style: none; padding: 0;">
            <li style="margin-bottom: 15px;"><strong style="color: #ffaa00; font-size: 1.2rem;">■ SPECIAL MOVE!</strong><br>1回のみ使用可能。相手に一直線に向かって超加速で突撃する必殺技！</li>
            <li style="margin-bottom: 15px;"><strong style="color: #00ffcc; font-size: 1.2rem;">■ DEFENSE!</strong><br>1回のみ使用可能。その場で踏ん張り、重量を上げて弾き飛ばされにくくなる。</li>
            <li style="margin-bottom: 15px;"><strong style="color: #ffff33; font-size: 1.2rem;">■ QUICK TURN</strong><br>クールダウン後何度でも使用可能。外側に弾かれた時、スタジアム中央へ向かって軌道を戻す。</li>
        </ul>
    `,
    balance: `
        <h2 style="color: #3388ff; margin-top: 0;">BALANCE TYPE SKILLS</h2>
        <ul style="text-align: left; line-height: 1.6; font-size: 1.1rem; color: #ddd; max-width: 600px; margin: 0 auto; list-style: none; padding: 0;">
            <li style="margin-bottom: 15px;"><strong style="color: #ffaa00; font-size: 1.2rem;">■ SPECIAL MOVE!</strong><br>1回のみ使用可能。相手に一直線に向かって超加速で突撃する必殺技！</li>
            <li style="margin-bottom: 15px;"><strong style="color: #00ffcc; font-size: 1.2rem;">■ DEFENSE!</strong><br>1回のみ使用可能。その場で踏ん張り、重量を上げる。</li>
            <li style="margin-bottom: 15px;"><strong style="color: #3388ff; font-size: 1.2rem;">■ MODE: STAMINA / ATTACK</strong><br>何度でも使用可能。中央で回る「スタミナ」と外周から攻める「アタック」を切り替える。</li>
            <li style="margin-bottom: 15px;"><strong style="color: #ff3333; font-size: 1.2rem;">■ TARGET DASH!</strong><br>クールダウン後何度でも使用可能。相手を正確に狙って高速で突進する大技！</li>
        </ul>
    `
};

document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        playerType = btn.closest('.type-btn').dataset.type;
        // Random CPU type
        const types = Object.keys(BEY_TYPES);
        cpuType = types[Math.floor(Math.random() * types.length)];
        
        // Show explanation phase
        document.getElementById('type-explanation-content').innerHTML = typeExplanations[playerType];
        switchScene('explanation');
    });
});

btnStartShoot.addEventListener('click', () => {
    startShootPhase();
});

// --- Shoot Phase ---
let gaugeDir = 1;
let gaugeValue = 0;
let gaugeInterval = null;

function startShootPhase() {
    switchScene('shoot');
    gaugeValue = 0;
    gaugeDir = 1;
    powerBar.style.height = '0%';
    
    gaugeInterval = setInterval(() => {
        gaugeValue += 2 * gaugeDir;
        if (gaugeValue >= 100) {
            gaugeValue = 100;
            gaugeDir = -1;
        } else if (gaugeValue <= 0) {
            gaugeValue = 0;
            gaugeDir = 1;
        }
        powerBar.style.height = `${gaugeValue}%`;
    }, 16);
}

btnShoot.addEventListener('click', () => {
    if (currentScene !== 'shoot') return;
    clearInterval(gaugeInterval);
    
    // Calculate player power based on how close to 90% they stopped it
    // 90% is ideal (MAX)
    let accuracy = Math.abs(gaugeValue - 90);
    playerPower = Math.max(0.3, 1.2 - (accuracy / 100)); // 0.3 to ~1.2 multiplier

    // CPU power is random between 0.7 and 1.1
    cpuPower = 0.7 + Math.random() * 0.4;

    initBattle();
});

// --- Battle Phase ---
class Beyblade {
    constructor(isPlayer, typeName, powerMultiplier) {
        this.isPlayer = isPlayer;
        this.typeName = typeName;
        const stats = BEY_TYPES[typeName];
        this.weight = stats.weight;
        this.speed = stats.speed * powerMultiplier;
        this.stamina = stats.stamina * powerMultiplier;
        this.maxStamina = this.stamina;
        this.burstResist = stats.burstResist;
        this.color = stats.color;
        this.radius = BEY_RADIUS;

        this.hasUsedSpecial = false;
        this.isSpecialActive = false;
        this.hasUsedDefense = false;
        this.isDefenseActive = false;
        
        this.originalType = typeName;
        this.balanceMode = 'stamina'; // バランスタイプ用（'stamina' or 'attack'）

        // Starting positions
        if (isPlayer) {
            this.x = CENTER_X;
            this.y = CENTER_Y + 150;
            this.vx = 0;
            this.vy = -this.speed;
        } else {
            this.x = CENTER_X;
            this.y = CENTER_Y - 150;
            this.vx = 0;
            this.vy = this.speed;
        }
        
        // Add some random angle
        let angle = (Math.random() - 0.5) * Math.PI / 4;
        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let tx = this.vx * c - this.vy * s;
        let ty = this.vx * s + this.vy * c;
        this.vx = tx;
        this.vy = ty;
    }

    update() {
        if (this.burstResist <= 0) {
            if (!this.burstTime) {
                this.burstTime = Date.now();
                this.burstAngle = Math.random() * Math.PI * 2;
                // バースト時の大爆発エフェクト
                for (let i = 0; i < 15; i++) {
                    drawImpactSpark(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40);
                }
            }
            return; // バースト後は通常の物理演算を行わない
        }

        this.x += this.vx;
        this.y += this.vy;

        let dx = CENTER_X - this.x;
        let dy = CENTER_Y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > STADIUM_RADIUS) {
            this.isOver = true;
        }

        if (this.isOver) {
            // 場外に落ちた（オーバーフィニッシュ）
            this.scale = (this.scale === undefined ? 1 : this.scale) * 0.92; // 落下して小さくなる
            this.vx *= 0.98; // 空中なので摩擦少なめ
            this.vy *= 0.98;
            return;
        }

        if (this.stamina <= 0) {
            // 止まった状態の摩擦（急停止）
            this.vx *= 0.85;
            this.vy *= 0.85;
            return;
        }

        // Friction / Stamina decay
        this.stamina -= 1;
        let speedMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        

        
        // バランスタイプの場合、モードによって振る舞いを変える
        let activeType = this.typeName;
        if (this.originalType === 'balance') {
            activeType = this.balanceMode; // 'stamina' または 'attack'
        }

        // --- Type specific movement logic ---
        if (activeType === 'attack') {
            // アタック：花形軌道（壁にぶつかる前に強く中央へターンする）
            if (dist > 0) {
                this.vx += (-dy / dist) * 0.08; // Tangential force
                this.vy += (dx / dist) * 0.08;
                
                let pull = 0.02;
                if (dist > 150) {
                    pull += (dist - 150) * 0.008; // 外側にいくほど急激に中心へ向かう
                }
                this.vx += (dx / dist) * pull;
                this.vy += (dy / dist) * pull;
            }
            if (speedMag > 0) {
                this.vx *= 0.995;
                this.vy *= 0.995;
            }
        } 
        else if (activeType === 'stamina') {
            // スタミナ：常に中央に陣取る（純粋なスタミナの動き）
            if (dist > 0) {
                this.vx += (dx / dist) * 0.1;
                this.vy += (dy / dist) * 0.1;
            }
            if (speedMag > 0) {
                this.vx *= 0.95;
                this.vy *= 0.95;
            }
        }
        else if (activeType === 'defense') {
            // ディフェンス：中央に陣取る
            if (dist > 0) {
                this.vx += (dx / dist) * 0.08;
                this.vy += (dy / dist) * 0.08;
            }
            if (speedMag > 0) {
                this.vx *= 0.97;
                this.vy *= 0.97;
            }
        }
    }

    draw(ctx) {
        if (this.burstResist <= 0) {
            if (!this.burstTime) return;
            
            let elapsed = Date.now() - this.burstTime;
            let drift = elapsed * 0.15; // 割れた破片が飛んでいく速度
            let fade = Math.max(0, 1.0 - elapsed / 1500); // 1.5秒かけて透明になる
            
            ctx.globalAlpha = fade;
            
            // --- 上半分 ---
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.burstAngle);
            ctx.translate(0, -drift); // 分割線と垂直に飛ぶ
            ctx.rotate(elapsed * 0.005); // 回転しながら飛ぶ
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, Math.PI, 0); 
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.isPlayer ? '#ffffff' : '#555555';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.6, Math.PI, 0);
            ctx.fillStyle = '#222';
            ctx.fill();
            
            // 断面の線
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, 0);
            ctx.strokeStyle = '#555';
            ctx.stroke();
            ctx.restore();
            
            // --- 下半分 ---
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.burstAngle);
            ctx.translate(0, drift);
            ctx.rotate(-elapsed * 0.003); // 上半分とは違う回転
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI); 
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = this.isPlayer ? '#ffffff' : '#555555';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI);
            ctx.fillStyle = '#222';
            ctx.fill();
            
            // 断面の線
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(this.radius, 0);
            ctx.strokeStyle = '#555';
            ctx.stroke();
            ctx.restore();
            
            ctx.globalAlpha = 1.0;
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        
        let s = this.scale === undefined ? 1 : this.scale;

        if (this.isOver) {
            // オーバーフィニッシュで落下中の表現
            ctx.scale(s, s);
            ctx.globalAlpha = Math.max(0, s); // 落下するにつれて見えなくなる
            
            // 回転はそのまま
            let spinSpeed = (this.stamina / this.maxStamina) * 0.5;
            if(this.stamina > 0) ctx.rotate(Date.now() * spinSpeed * (this.isPlayer ? 1 : -1));
        } else if (this.stamina <= 0) {
            // スピンフィニッシュで止まった時の表現（倒れたように見せる）
            ctx.scale(s, s * 0.6); 
            ctx.globalAlpha = 0.6; // 少し暗くする
            
            // 完全に止まる直前は少し揺らす
            let speedMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speedMag > 0.1) {
                ctx.translate(Math.sin(Date.now() / 30) * 3, 0);
            }
        } else {
            // 通常の描画
            ctx.scale(s, s);
            let spinSpeed = (this.stamina / this.maxStamina) * 0.5;
            ctx.rotate(Date.now() * spinSpeed * (this.isPlayer ? 1 : -1));
        }

        // Draw body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.isPlayer ? '#ffffff' : '#555555';
        ctx.stroke();

        // Draw inner details
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(0, this.radius);
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(this.radius, 0);
        ctx.strokeStyle = '#555';
        ctx.stroke();

        ctx.restore();

        // Draw Aura if special active
        if (this.isSpecialActive) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2);
            ctx.fillStyle = this.isPlayer ? `rgba(255, 200, 0, 0.4)` : `rgba(255, 50, 50, 0.4)`;
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = this.isPlayer ? `rgba(255, 100, 0, 0.8)` : `rgba(255, 0, 0, 0.8)`;
            ctx.stroke();
            ctx.restore();
        }

        // Draw Shield if defense active
        if (this.isDefenseActive) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 150, 255, 0.4)`;
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = `rgba(0, 200, 255, 0.8)`;
            ctx.stroke();
            ctx.restore();
        }
    }
}

function initBattle() {
    isRoundEnding = false;
    switchScene('battle');
    battleMessage.classList.add('hidden');
    btnNextRound.classList.add('hidden');
    
    playerBey = new Beyblade(true, playerType, playerPower);
    cpuBey = new Beyblade(false, cpuType, cpuPower);
    
    btnSpecialMove.classList.remove('hidden');
    btnSpecialMove.disabled = false;
    btnSpecialMove.textContent = "SPECIAL MOVE!";
    
    btnDefense.classList.remove('hidden');
    btnDefense.disabled = false;
    btnDefense.textContent = "DEFENSE!";
    
    btnMove.classList.remove('hidden');
    btnMove.classList.remove('cooldown');
    if (playerType === 'balance') {
        btnMove.textContent = "MODE: STAMINA";
        btnFigure8.classList.remove('hidden');
        btnFigure8.classList.remove('cooldown');
    } else if (playerType === 'attack') {
        btnMove.textContent = "TARGET DASH!";
        btnFigure8.classList.add('hidden');
    } else {
        btnMove.textContent = "QUICK TURN";
        btnFigure8.classList.add('hidden');
    }
    
    // CPU Special Move Timer (試合時間が延びたので、少し遅めに発動するように調整)
    let cpuSpecialDelay = 4000 + Math.random() * 8000; // 4 to 12 seconds
    setTimeout(() => {
        if (currentScene === 'battle' && cpuBey && cpuBey.stamina > 0 && !cpuBey.hasUsedSpecial) {
            triggerCpuSpecial();
        }
    }, cpuSpecialDelay);
    
    // CPU Defense Timer (1回のみ発動)
    let cpuDefenseDelay = 6000 + Math.random() * 6000; // 6〜12秒後に発動
    setTimeout(() => {
        if (currentScene === 'battle' && cpuBey && cpuBey.stamina > 0 && !cpuBey.hasUsedDefense) {
            triggerCpuDefense();
        }
    }, cpuDefenseDelay);
    
    // CPU Quick Turn / Mode Change Timer (繰り返し発動)
    scheduleCpuQuickTurn();
    
    // CPUがバランスタイプの場合、専用のTARGET DASH（4つ目のボタン）も定期発動
    if (cpuType === 'balance') {
        scheduleCpuTargetDash();
    }

    if (animationId) cancelAnimationFrame(animationId);
    battleLoop();
}

function triggerCpuQuickTurn() {
    if (!cpuBey || cpuBey.stamina <= 0 || currentScene !== 'battle') return;
    
    // バランスタイプならモードチェンジ
    if (cpuBey.originalType === 'balance') {
        cpuBey.balanceMode = cpuBey.balanceMode === 'stamina' ? 'attack' : 'stamina';
        drawImpactSpark(cpuBey.x, cpuBey.y);
        
        // アタックモードに切り替わった時だけ、クイックターンの突撃も発動する
        if (cpuBey.balanceMode === 'attack') {
            let tempVx = cpuBey.vx;
            let tempVy = cpuBey.vy;
            let speed = Math.sqrt(tempVx * tempVx + tempVy * tempVy);
            let dx = CENTER_X - cpuBey.x;
            let dy = CENTER_Y - cpuBey.y;
            let angleToCenter = Math.atan2(dy, dx);
            let randomOffset = (Math.random() - 0.5) * (Math.PI / 3);
            let newAngle = angleToCenter + randomOffset;
            cpuBey.vx = Math.cos(newAngle) * (speed * 1.2 + 2.0);
            cpuBey.vy = Math.sin(newAngle) * (speed * 1.2 + 2.0);
        }
        return;
    }
    
    // アタックタイプの場合はTARGET DASH（相手へ一直線に突撃）
    if (cpuBey.originalType === 'attack') {
        let dx = playerBey.x - cpuBey.x;
        let dy = playerBey.y - cpuBey.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
            let currentSpeed = Math.sqrt(cpuBey.vx * cpuBey.vx + cpuBey.vy * cpuBey.vy);
            let dashSpeed = Math.max(15, currentSpeed * 1.5);
            cpuBey.vx = (dx / dist) * dashSpeed;
            cpuBey.vy = (dy / dist) * dashSpeed;
        }
        for(let i=0; i<5; i++) drawImpactSpark(cpuBey.x + (Math.random()-0.5)*30, cpuBey.y + (Math.random()-0.5)*30);
        return;
    }
    
    // それ以外のタイプ（ディフェンス・スタミナ）は中央へのクイックターン
    let tempVx = cpuBey.vx;
    let tempVy = cpuBey.vy;
    let speed = Math.sqrt(tempVx * tempVx + tempVy * tempVy);
    
    let dx = CENTER_X - cpuBey.x;
    let dy = CENTER_Y - cpuBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    // 中心へ向かう角度をベースに、±30度ずらして突撃する
    let angleToCenter = Math.atan2(dy, dx);
    let randomOffset = (Math.random() - 0.5) * (Math.PI / 3);
    let newAngle = angleToCenter + randomOffset;
    
    cpuBey.vx = Math.cos(newAngle) * (speed * 1.2 + 2.0); // 最低限のスピードを保証しつつ加速
    cpuBey.vy = Math.sin(newAngle) * (speed * 1.2 + 2.0);
    
    drawImpactSpark(cpuBey.x, cpuBey.y);
}

function scheduleCpuQuickTurn() {
    if (currentScene !== 'battle') return;
    let delay = 3000 + Math.random() * 5000; // 3〜8秒間隔で軌道変更
    setTimeout(() => {
        if (currentScene === 'battle' && cpuBey && cpuBey.stamina > 0) {
            triggerCpuQuickTurn();
            scheduleCpuQuickTurn();
        }
    }, delay);
}

function triggerCpuDefense() {
    if (!cpuBey || cpuBey.stamina <= 0 || cpuBey.hasUsedDefense) return;
    cpuBey.hasUsedDefense = true;
    cpuBey.isDefenseActive = true;
    
    // 構えて踏ん張る（少し減速）
    cpuBey.vx *= 0.1;
    cpuBey.vy *= 0.1;
    
    setTimeout(() => {
        if(cpuBey) cpuBey.isDefenseActive = false;
    }, 1500);
}

function scheduleCpuTargetDash() {
    if (currentScene !== 'battle') return;
    let delay = 4000 + Math.random() * 5000; // 4〜9秒間隔でTARGET DASH
    setTimeout(() => {
        if (currentScene === 'battle' && cpuBey && cpuBey.stamina > 0) {
            triggerCpuTargetDash();
            scheduleCpuTargetDash();
        }
    }, delay);
}

function triggerCpuTargetDash() {
    if (!cpuBey || cpuBey.stamina <= 0 || currentScene !== 'battle') return;
    
    // 相手の場所を狙って鋭く突撃
    let dx = playerBey.x - cpuBey.x;
    let dy = playerBey.y - cpuBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > 0) {
        let currentSpeed = Math.sqrt(cpuBey.vx * cpuBey.vx + cpuBey.vy * cpuBey.vy);
        let dashSpeed = Math.max(15, currentSpeed * 1.5);
        
        cpuBey.vx = (dx / dist) * dashSpeed;
        cpuBey.vy = (dy / dist) * dashSpeed;
    }
    
    // 突撃エフェクト
    for(let i=0; i<5; i++) {
        drawImpactSpark(cpuBey.x + (Math.random()-0.5)*30, cpuBey.y + (Math.random()-0.5)*30);
    }
}

function triggerCpuSpecial() {
    if (!cpuBey || cpuBey.stamina <= 0) return;
    cpuBey.hasUsedSpecial = true;
    cpuBey.isSpecialActive = true;
    
    let dx = playerBey.x - cpuBey.x;
    let dy = playerBey.y - cpuBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if(dist > 0) {
        cpuBey.vx = (dx / dist) * 12;
        cpuBey.vy = (dy / dist) * 12;
    }
    
    setTimeout(() => {
        if(cpuBey) cpuBey.isSpecialActive = false;
    }, 1500);
}

btnSpecialMove.addEventListener('click', () => {
    if (currentScene !== 'battle' || playerBey.stamina <= 0 || playerBey.hasUsedSpecial) return;
    
    playerBey.hasUsedSpecial = true;
    playerBey.isSpecialActive = true;
    btnSpecialMove.disabled = true;
    btnSpecialMove.textContent = "USED";
    
    // special move effect: point directly at CPU and accelerate massively
    let dx = cpuBey.x - playerBey.x;
    let dy = cpuBey.y - playerBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    if(dist > 0) {
        playerBey.vx = (dx / dist) * 12; // バランスの良いスピードに調整（元30）
        playerBey.vy = (dy / dist) * 12;
    }
    
    setTimeout(() => {
        if(playerBey) playerBey.isSpecialActive = false;
    }, 1500); // Effect lasts 1.5 seconds
});

btnDefense.addEventListener('click', () => {
    if (currentScene !== 'battle' || playerBey.stamina <= 0 || playerBey.hasUsedDefense) return;
    
    playerBey.hasUsedDefense = true;
    playerBey.isDefenseActive = true;
    btnDefense.disabled = true;
    btnDefense.textContent = "USED";
    
    // 構えて踏ん張る（少し減速）
    playerBey.vx *= 0.1;
    playerBey.vy *= 0.1;
    
    setTimeout(() => {
        if(playerBey) playerBey.isDefenseActive = false;
    }, 1500); // Effect lasts 1.5 seconds
});

let moveCooldown = false;
btnMove.addEventListener('click', () => {
    if (currentScene !== 'battle' || playerBey.stamina <= 0 || moveCooldown) return;
    
    moveCooldown = true;
    btnMove.classList.add('cooldown');
    
    // バランスタイプの場合はモード切替
    if (playerBey.originalType === 'balance') {
        playerBey.balanceMode = playerBey.balanceMode === 'stamina' ? 'attack' : 'stamina';
        btnMove.textContent = `MODE: ${playerBey.balanceMode.toUpperCase()}`;
        drawImpactSpark(playerBey.x, playerBey.y);
        
        // アタックモードに切り替わった時だけ、クイックターン（急降下）も同時に発動する
        if (playerBey.balanceMode === 'attack') {
            let tempVx = playerBey.vx;
            let tempVy = playerBey.vy;
            let speed = Math.sqrt(tempVx * tempVx + tempVy * tempVy);
            let dx = CENTER_X - playerBey.x;
            let dy = CENTER_Y - playerBey.y;
            let angleToCenter = Math.atan2(dy, dx);
            let randomOffset = (Math.random() - 0.5) * (Math.PI / 3);
            let newAngle = angleToCenter + randomOffset;
            playerBey.vx = Math.cos(newAngle) * (speed * 1.2 + 2.0);
            playerBey.vy = Math.sin(newAngle) * (speed * 1.2 + 2.0);
        }
        
        setTimeout(() => {
            moveCooldown = false;
            btnMove.classList.remove('cooldown');
        }, 1500); // バランスのモード切替は1.5秒クールダウン
        return;
    }
    
    // アタックタイプの場合はTARGET DASH（相手へ一直線に突撃）
    if (playerBey.originalType === 'attack') {
        let dx = cpuBey.x - playerBey.x;
        let dy = cpuBey.y - playerBey.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
            let currentSpeed = Math.sqrt(playerBey.vx * playerBey.vx + playerBey.vy * playerBey.vy);
            let dashSpeed = Math.max(15, currentSpeed * 1.5);
            playerBey.vx = (dx / dist) * dashSpeed;
            playerBey.vy = (dy / dist) * dashSpeed;
        }
        for(let i=0; i<5; i++) drawImpactSpark(playerBey.x + (Math.random()-0.5)*30, playerBey.y + (Math.random()-0.5)*30);
        btnMove.textContent = "TARGET DASH!";
        
        setTimeout(() => {
            if(currentScene === 'battle') btnMove.textContent = "TARGET DASH!";
        }, 1000);
        
    } else {
        // ディフェンス、スタミナは中央へのクイックターン
        let tempVx = playerBey.vx;
        let tempVy = playerBey.vy;
        let speed = Math.sqrt(tempVx * tempVx + tempVy * tempVy);
        
        let dx = CENTER_X - playerBey.x;
        let dy = CENTER_Y - playerBey.y;
        
        let angleToCenter = Math.atan2(dy, dx);
        let randomOffset = (Math.random() - 0.5) * (Math.PI / 3);
        let newAngle = angleToCenter + randomOffset;
        
        playerBey.vx = Math.cos(newAngle) * (speed * 1.2 + 2.0);
        playerBey.vy = Math.sin(newAngle) * (speed * 1.2 + 2.0);
        
        btnMove.textContent = "QUICK TURN!";
        drawImpactSpark(playerBey.x, playerBey.y);
        
        setTimeout(() => {
            if(currentScene === 'battle') btnMove.textContent = "QUICK TURN";
        }, 1000);
    }
    
    setTimeout(() => {
        moveCooldown = false;
        btnMove.classList.remove('cooldown');
    }, 3000); // 3秒間のクールダウン
});

let figure8Cooldown = false;
btnFigure8.addEventListener('click', () => {
    if (currentScene !== 'battle' || playerBey.stamina <= 0 || figure8Cooldown) return;
    
    figure8Cooldown = true;
    btnFigure8.classList.add('cooldown');
    
    // 相手の場所を狙って鋭く突撃
    let dx = cpuBey.x - playerBey.x;
    let dy = cpuBey.y - playerBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > 0) {
        let currentSpeed = Math.sqrt(playerBey.vx * playerBey.vx + playerBey.vy * playerBey.vy);
        let dashSpeed = Math.max(15, currentSpeed * 1.5); // 最低でも15の強烈なスピードで突撃
        
        playerBey.vx = (dx / dist) * dashSpeed;
        playerBey.vy = (dy / dist) * dashSpeed;
    }
    
    // 突撃エフェクト
    for(let i=0; i<5; i++) {
        drawImpactSpark(playerBey.x + (Math.random()-0.5)*30, playerBey.y + (Math.random()-0.5)*30);
    }
    
    setTimeout(() => {
        figure8Cooldown = false;
        btnFigure8.classList.remove('cooldown');
    }, 4000); // 4秒間のクールダウン
});


function checkCollision() {
    let dx = cpuBey.x - playerBey.x;
    let dy = cpuBey.y - playerBey.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < playerBey.radius + cpuBey.radius) {
        // Resolve overlap
        let overlap = (playerBey.radius + cpuBey.radius) - dist;
        let nx = dx / dist;
        let ny = dy / dist;
        
        playerBey.x -= nx * overlap / 2;
        playerBey.y -= ny * overlap / 2;
        cpuBey.x += nx * overlap / 2;
        cpuBey.y += ny * overlap / 2;

        // Elastic collision
        let pWeight = playerBey.isDefenseActive ? playerBey.weight * 5 : playerBey.weight;
        let cWeight = cpuBey.isDefenseActive ? cpuBey.weight * 5 : cpuBey.weight;

        let kx = (playerBey.vx - cpuBey.vx);
        let ky = (playerBey.vy - cpuBey.vy);
        let p = 2.0 * (nx * kx + ny * ky) / (pWeight + cWeight);
        
        playerBey.vx = playerBey.vx - p * cWeight * nx;
        playerBey.vy = playerBey.vy - p * cWeight * ny;
        cpuBey.vx = cpuBey.vx + p * pWeight * nx;
        cpuBey.vy = cpuBey.vy + p * pWeight * ny;

        // Add extra bounce based on speed
        let impact = Math.abs(p);
        
        // Reduce stamina and burst resistance
        if (!playerBey.isDefenseActive) playerBey.stamina -= impact * 20;
        if (!cpuBey.isDefenseActive) cpuBey.stamina -= impact * 20;
        
        if (impact > 2) {
            if (!playerBey.isDefenseActive) playerBey.burstResist -= 1;
            if (!cpuBey.isDefenseActive) cpuBey.burstResist -= 1;
            drawImpactSpark(playerBey.x + nx * playerBey.radius, playerBey.y + ny * playerBey.radius);
        }
    }
}

let sparks = [];
function drawImpactSpark(x, y) {
    sparks.push({x, y, life: 10});
}

function handleWallCollision(bey) {
    let dx = bey.x - CENTER_X;
    let dy = bey.y - CENTER_Y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    // Check if touching the boundary
    if (dist > STADIUM_RADIUS - bey.radius) {
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        
        // 3 sections. Each has 80 deg wall, 40 deg pocket
        let segmentAngle = angle % (2 * Math.PI / 3);
        let isWall = segmentAngle < (4 * Math.PI / 9);
        
        if (isWall) {
            // Push back inside
            let overlap = dist - (STADIUM_RADIUS - bey.radius);
            let nx = dx / dist; // outward normal
            let ny = dy / dist; // outward normal
            
            bey.x -= nx * overlap;
            bey.y -= ny * overlap;
            
            // Bounce
            let dot = bey.vx * nx + bey.vy * ny;
            if (dot > 0) { // moving outwards
                let restitution = 0.6; // energy loss
                bey.vx = bey.vx - (1 + restitution) * dot * nx;
                bey.vy = bey.vy - (1 + restitution) * dot * ny;
                
                // 強くぶつかった時だけスタミナを削る（擦りダメージは最小限）
                if (dot > 2.0) {
                    bey.stamina -= dot * 2;
                    drawImpactSpark(bey.x + nx * bey.radius, bey.y + ny * bey.radius);
                } else {
                    bey.stamina -= 1;
                }
            }
        }
    }
}

function checkBounds(bey) {
    let dx = bey.x - CENTER_X;
    let dy = bey.y - CENTER_Y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > STADIUM_RADIUS) {
        return "over";
    }
    return null;
}

function battleLoop() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw stadium ring (Base/Pockets)
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, STADIUM_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw walls (Neon color)
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 10;
    for (let i = 0; i < 3; i++) {
        let startAngle = i * (2 * Math.PI / 3);
        let endAngle = startAngle + (4 * Math.PI / 9);
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, STADIUM_RADIUS, startAngle, endAngle);
        ctx.stroke();
    }

    playerBey.update();
    cpuBey.update();

    if (playerBey.stamina > 0) handleWallCollision(playerBey);
    if (cpuBey.stamina > 0) handleWallCollision(cpuBey);

    if (playerBey.stamina > 0 && cpuBey.stamina > 0) {
        checkCollision();
    }

    playerBey.draw(ctx);
    cpuBey.draw(ctx);

    // Draw sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
        let s = sparks[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.life, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255, 200, 0, ${s.life/10})`;
        ctx.fill();
        s.life -= 1;
        if(s.life <= 0) sparks.splice(i, 1);
    }

    // Check Win Conditions
    if (!isRoundEnding) {
        let pOver = checkBounds(playerBey);
        let cOver = checkBounds(cpuBey);
        
        let result = null;
        let points = 0;
        let winner = null;

        if (playerBey.burstResist <= 0 && cpuBey.burstResist > 0) {
            result = "BURST FINISH!"; points = 2; winner = "CPU";
        } else if (cpuBey.burstResist <= 0 && playerBey.burstResist > 0) {
            result = "BURST FINISH!"; points = 2; winner = "PLAYER";
        } else if (pOver && !cOver) {
            result = "OVER FINISH!"; points = 1; winner = "CPU";
        } else if (cOver && !pOver) {
            result = "OVER FINISH!"; points = 1; winner = "PLAYER";
        } else if (pOver && cOver) {
            result = "DRAW!"; points = 0; winner = "NONE";
        } else if (playerBey.stamina <= 0 && cpuBey.stamina > 0) {
            result = "SPIN FINISH!"; points = 1; winner = "CPU";
        } else if (cpuBey.stamina <= 0 && playerBey.stamina > 0) {
            result = "SPIN FINISH!"; points = 1; winner = "PLAYER";
        } else if (playerBey.stamina <= 0 && cpuBey.stamina <= 0) {
            result = "DRAW!"; points = 0; winner = "NONE";
        }

        if (result) {
            isRoundEnding = true;
            endRound(result, points, winner);
        }
    }

    if (currentScene === 'battle') {
        animationId = requestAnimationFrame(battleLoop);
    }
}

function endRound(resultText, points, winner) {
    if (winner === "PLAYER") playerScore += points;
    if (winner === "CPU") cpuScore += points;
    
    updateScoreboard();

    messageText.textContent = resultText;
    if (winner === "DRAW" || winner === "NONE") {
        messageSubtext.textContent = "NO POINTS";
    } else {
        messageSubtext.textContent = `${winner} GETS +${points} POINTS`;
    }

    battleMessage.classList.remove('hidden');
    btnSpecialMove.classList.add('hidden');
    btnDefense.classList.add('hidden');
    btnMove.classList.add('hidden');

    if (playerScore >= TARGET_SCORE || cpuScore >= TARGET_SCORE) {
        setTimeout(showResult, 2000);
    } else {
        btnNextRound.classList.remove('hidden');
    }
}

function updateScoreboard() {
    playerPointsEl.textContent = playerScore;
    cpuPointsEl.textContent = cpuScore;
}

btnNextRound.addEventListener('click', () => {
    startShootPhase(); // 同じベイを使って次のラウンド（シュートフェーズ）へ
});

// --- Result Phase ---
function showResult() {
    switchScene('result');
    if (playerScore >= TARGET_SCORE && playerScore > cpuScore) {
        resultTitle.textContent = "YOU WIN!";
        resultTitle.className = "win";
    } else if (cpuScore >= TARGET_SCORE && cpuScore > playerScore) {
        resultTitle.textContent = "YOU LOSE...";
        resultTitle.className = "lose";
    } else {
        resultTitle.textContent = "DRAW...";
        resultTitle.className = "";
    }
    resultDetail.textContent = `FINAL SCORE: ${playerScore} - ${cpuScore}`;
}

btnRestart.addEventListener('click', () => {
    playerScore = 0;
    cpuScore = 0;
    updateScoreboard();
    switchScene('selection'); // 完全決着後は機体選択へ戻る
});

// Initialize
updateScoreboard();
