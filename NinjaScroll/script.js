const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const countdownScreen = document.getElementById('countdown-screen');
const countdownText = document.getElementById('countdown-text');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let gameState = 'START'; // START, COUNTDOWN, PLAYING, GAMEOVER
let gameSpeed = 6;
let frameCount = 0;
let animationId;

let player, entities = [], particles = [], backgrounds = [];

const keys = { Space: false, ArrowUp: false, KeyW: false, KeyX: false };

window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'KeyW', 'KeyX'].includes(e.code)) {
        if (gameState === 'PLAYING') {
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && document.activeElement !== restartBtn) player.jump();
            if (e.code === 'KeyX') player.shoot();
        }
        if (gameState !== 'START') e.preventDefault();
    }
});

restartBtn.addEventListener('click', () => {
    restartBtn.blur();
    startCountdown();
});

class ParallaxLayer {
    constructor(imageType, speed, yOffset, scale) {
        this.speed = speed;
        this.yOffset = yOffset;
        this.items = [];
        for(let i=0; i<5; i++) {
            this.items.push({ x: i * 300 * scale, y: yOffset, w: 100*scale, h: 200*scale });
        }
    }
    update(speedMultiplier) {
        if(gameState !== 'PLAYING') return; // pause background if not playing
        this.items.forEach(item => {
            item.x -= this.speed * speedMultiplier;
            if (item.x + item.w < 0) item.x += 1500; // loop
        });
    }
    draw(ctx) {
        ctx.fillStyle = '#1e2a38';
        this.items.forEach(item => {
            ctx.beginPath();
            ctx.moveTo(item.x, canvas.height);
            ctx.lineTo(item.x + item.w/2, item.y);
            ctx.lineTo(item.x + item.w, canvas.height);
            ctx.fill();
        });
    }
}

class Player {
    constructor() {
        this.r = 20; // radius
        this.x = 100;
        this.y = canvas.height - 40 - this.r;
        this.vy = 0;
        this.gravity = 0.8;
        this.jumpPower = -16;
        this.isGrounded = true;
        this.cooldown = 0;
        this.scarfLength = 0;
    }
    update() {
        this.vy += this.gravity;
        this.y += this.vy;
        const groundY = canvas.height - 40;
        if (this.y + this.r > groundY) {
            this.y = groundY - this.r;
            this.vy = 0;
            if (!this.isGrounded) this.land();
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        if (this.cooldown > 0) this.cooldown--;
        this.scarfLength += 0.2;
    }
    land() {
        createParticles(this.x, this.y + this.r, 10, '#ffffff', 2);
    }
    jump() {
        if (this.isGrounded) {
            this.vy = this.jumpPower;
            this.isGrounded = false;
            createParticles(this.x, this.y + this.r, 15, '#00d2d3', 3);
        }
    }
    shoot() {
        if (this.cooldown <= 0) {
            entities.push(new Star(this.x + this.r, this.y));
            this.cooldown = 15;
            createParticles(this.x + this.r, this.y, 5, '#fff', 1);
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d2d3';
        
        // Body
        ctx.fillStyle = '#222f3e';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r, this.r*1.2, 0, 0, Math.PI*2);
        ctx.fill();

        // Scarf
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 4;
        ctx.beginPath();
        let scarfY = Math.sin(this.scarfLength) * 10;
        ctx.moveTo(-this.r+5, -5);
        ctx.quadraticCurveTo(-40, scarfY - 10, -60, scarfY);
        ctx.stroke();

        // Eye
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#00d2d3';
        ctx.beginPath();
        ctx.arc(8, -8, 4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

class Star {
    constructor(x, y) {
        this.type = 'star';
        this.x = x;
        this.y = y;
        this.r = 12;
        this.speed = 15;
        this.angle = 0;
        this.active = true;
    }
    update() {
        this.x += this.speed;
        this.angle += 0.4;
        if (this.x > canvas.width + 50) this.active = false;
        
        if (Math.random() < 0.5) createParticles(this.x, this.y, 1, '#00d2d3', 1.5, 0, 0);
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d2d3';
        ctx.fillStyle = '#fff';

        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.lineTo(0, -this.r);
            ctx.lineTo(this.r/3, -this.r/3);
            ctx.rotate(Math.PI / 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor() {
        this.type = 'enemy';
        const rand = Math.random();
        this.enemyType = rand < 0.4 ? 'dragon' : (rand < 0.7 ? 'obstacle' : 'bomb');
        this.r = this.enemyType === 'dragon' ? 25 : (this.enemyType === 'bomb' ? 18 : 30);
        this.x = canvas.width + 50;
        this.y = canvas.height - 40 - this.r;
        this.speed = gameSpeed + (this.enemyType === 'dragon' ? 2 : 0);
        if (this.enemyType === 'obstacle') this.speed = gameSpeed;
        this.active = true;
    }
    update() {
        this.x -= this.speed;
        if (this.x < -100) {
            this.active = false;
            // if we successfully jumped or avoided it, score
            score += 15;
        }
        if (this.enemyType === 'bomb' && Math.random() < 0.2) {
            createParticles(this.x, this.y - this.r - 5, 1, '#ffeb3b', 2, 0, -2);
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.enemyType === 'dragon') {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff4757';
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.moveTo(this.r, 0);
            ctx.lineTo(-this.r, -this.r);
            ctx.lineTo(-this.r/2, 0);
            ctx.lineTo(-this.r, this.r);
            ctx.fill();
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fbc531';
            ctx.fillStyle = '#fbc531';
            ctx.beginPath();
            ctx.arc(this.r/2, -5, 4, 0, Math.PI*2);
            ctx.fill();

        } else if (this.enemyType === 'bomb') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff4757';
            let grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, this.r);
            grad.addColorStop(0, '#576574');
            grad.addColorStop(1, '#222f3e');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.r, 0, Math.PI*2);
            ctx.fill();

            ctx.strokeStyle = '#c8d6e5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -this.r);
            ctx.quadraticCurveTo(10, -this.r-10, 5, -this.r-15);
            ctx.stroke();

        } else if (this.enemyType === 'obstacle') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#9c88ff';
            ctx.fillStyle = '#8c7ae6';
            ctx.beginPath();
            ctx.moveTo(0, -this.r*1.5);
            ctx.lineTo(this.r, this.r);
            ctx.lineTo(-this.r, this.r);
            ctx.fill();
            
            ctx.fillStyle = '#dcdde1';
            ctx.beginPath();
            ctx.moveTo(0, -this.r+5);
            ctx.lineTo(this.r/3, this.r);
            ctx.lineTo(-this.r/3, this.r);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, size, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx !== undefined ? vx : (Math.random() - 0.5) * 8;
        this.vy = vy !== undefined ? vy : (Math.random() - 0.5) * 8;
        this.life = 1;
        this.color = color;
        this.size = size;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.04;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

function createParticles(x, y, count, color, size, vx, vy) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, size + Math.random()*2, vx, vy));
    }
}

function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (c1.r + c2.r)*0.85; // slightly forgiving hitboxes
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    backgrounds.forEach(bg => {
        bg.update(1);
        bg.draw(ctx);
    });

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00d2d3';
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();
    ctx.restore();
}

function showFloatingScore(text, x, y, color) {
    // simplified visual pop up effect via particles
}

function startCountdown() {
    gameOverScreen.classList.add('hidden');
    countdownScreen.classList.remove('hidden');
    gameState = 'COUNTDOWN';
    countdownValue = 3;
    countdownText.innerText = countdownValue;
    
    player = new Player();
    entities = [];
    particles = [];
    backgrounds = [new ParallaxLayer('mountain', 1, 150, 1.5), new ParallaxLayer('trees', 2, 250, 1)];
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    scoreElement.innerText = score;

    drawBackground();
    player.draw();

    const interval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            countdownText.innerText = countdownValue;
        } else if (countdownValue === 0) {
            countdownText.innerText = 'GO!';
        } else {
            clearInterval(interval);
            countdownScreen.classList.add('hidden');
            gameState = 'PLAYING';
            if (animationId) cancelAnimationFrame(animationId);
            loop();
        }
    }, 1000);
}

function loop() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    player.update();
    player.draw();

    if (frameCount % Math.max(40, 120 - Math.floor(score/10)) === 0) {
        entities.push(new Enemy());
    }

    for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.update();
        ent.draw();

        if (ent.type === 'enemy') {
            if (checkCircleCollision(player, ent)) {
                if (ent.enemyType === 'dragon' || ent.enemyType === 'obstacle' || ent.enemyType === 'bomb') {
                    gameOver();
                }
            }

            for (let j = entities.length - 1; j >= 0; j--) {
                const star = entities[j];
                if (star.type === 'star' && star.active && ent.active && checkCircleCollision(star, ent)) {
                    star.active = false;
                    
                    if (ent.enemyType === 'dragon') {
                        ent.active = false;
                        score += 50;
                        createParticles(ent.x, ent.y, 30, '#ff4757', 3);
                    } else if (ent.enemyType === 'bomb') {
                        ent.active = false;
                        score -= 100;
                        createParticles(ent.x, ent.y, 40, '#fbc531', 4);
                    } else if (ent.enemyType === 'obstacle') {
                        createParticles(star.x, star.y, 10, '#00d2d3', 2);
                    }
                }
            }
        }
    }

    entities = entities.filter(e => e.active);

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    scoreElement.innerText = score;
    frameCount++;
    if (frameCount % 600 === 0) gameSpeed += 0.5;

    animationId = requestAnimationFrame(loop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreElement.innerText = score;
    gameOverScreen.classList.remove('hidden');
    createParticles(player.x, player.y, 50, '#00d2d3', 4);
}

// Ensure game gets ready
drawBackground();
player = new Player(); // temp display
player.draw();
startCountdown();
