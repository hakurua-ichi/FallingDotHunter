const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreSpan = document.getElementById("score");
const bestScoreSpan = document.getElementById("bestScore");
const heartsSpan = document.getElementById("hearts");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const difficultySelect = document.getElementById("difficulty");

const DIFFICULTY_SETTINGS = {
    easy: { baseSpeed: 100, speedIncrease: 10, maxSpeed: 400, startRadius: 35, radiusDecrease: 0.1, minRadius: 20 },
    normal: { baseSpeed: 150, speedIncrease: 15, maxSpeed: 600, startRadius: 30, radiusDecrease: 0.3, minRadius: 15 },
    hard: { baseSpeed: 200, speedIncrease: 20, maxSpeed: 800, startRadius: 25, radiusDecrease: 0.5, minRadius: 12 }
};

const gameState = {
    circle: {
        x: 0,
        y: 0,
        r: 30,
        speedX: 0,
        speedY: 150,
        color: getRandomColor(),
    },
    score: 0,
    bestScore: localStorage.getItem('bestScore') || 0,
    heart: 3,
    lastTime: 0,
    clickQueue: [],
    isRunning: false,
    isPaused: false,
    difficulty: 'normal',
};

function getRandomColor() {
    return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
}

function resetCircle() {
    const c = gameState.circle;
    c.x = Math.random() * (canvas.width - c.r * 2) + c.r;
    c.y = -c.r;
    c.color = getRandomColor();
}

function updateHearts() {
    heartsSpan.textContent = '❤️'.repeat(gameState.heart);
}

function updateBestScore() {
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem('bestScore', gameState.bestScore); // 로컬스토리지 사용.
        bestScoreSpan.textContent = gameState.bestScore;
    }
}

// 속도에 따른 히트박스 확장 계산 (위쪽으로 확장)
function getHitboxExtension() {
    const c = gameState.circle;
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    const baseSpeed = settings.baseSpeed;
    const currentSpeed = c.speedY;
    
    // 속도 증가 비율에 따라 히트박스 확장 (최대 원 반지름만큼)
    const speedRatio = (currentSpeed - baseSpeed) / (settings.maxSpeed - baseSpeed);
    const maxExtension = c.r; // 최대 확장은 원의 반지름만큼
    return speedRatio * maxExtension;
}

function drawCircle() {
    const c = gameState.circle;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.closePath();
}

function gameLoop(currentTime) {
    if (!gameState.isRunning || gameState.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState.lastTime === 0) {
        gameState.lastTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (currentTime - gameState.lastTime) / 1000;
    gameState.lastTime = currentTime;

    while (gameState.clickQueue.length > 0) {
        const click = gameState.clickQueue.shift();
        const c = gameState.circle;
        
        const dx = click.x - c.x;
        const dy = click.y - c.y;
        
        // 히트박스 보정
        const hitboxExtension = getHitboxExtension();
        const adjustedDy = dy < 0 ? dy + hitboxExtension : dy;
        
        const distance = Math.sqrt(dx * dx + adjustedDy * adjustedDy);

        if (distance < c.r) {
            gameState.score++;
            scoreSpan.textContent = gameState.score;
            updateBestScore();
            
            const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
            c.speedY = Math.min(c.speedY + settings.speedIncrease, settings.maxSpeed);
            
            // 원 크기 감소 (최소 크기 제한)
            c.r = Math.max(c.r - settings.radiusDecrease, settings.minRadius);
            
            resetCircle();
            break;
        }
    }

    const c = gameState.circle;
    c.x += c.speedX * deltaTime;
    c.y += c.speedY * deltaTime;

    if (c.y - c.r > canvas.height) {
        resetCircle();
        gameState.heart--;
        updateHearts();
        
        if (gameState.heart <= 0) {
            gameState.isRunning = false;
            updateBestScore();
            alert("게임 오버! 최종 점수: " + gameState.score);
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.textContent = "게임 시작";
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle();

    requestAnimationFrame(gameLoop);
}


// 버튼 이벤트
startBtn.addEventListener("click", function() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        gameState.score = 0;
        gameState.heart = 3;
        gameState.difficulty = difficultySelect.value;
        
        const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
        gameState.circle.speedY = settings.baseSpeed;
        gameState.circle.r = settings.startRadius; // 난이도별 시작 크기 설정
        
        scoreSpan.textContent = gameState.score;
        updateHearts();
        resetCircle();
        gameState.lastTime = 0;
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = "게임 진행 중";
        difficultySelect.disabled = true;
    }
});

pauseBtn.addEventListener("click", function() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        pauseBtn.textContent = "계속하기";
    } else {
        pauseBtn.textContent = "일시정지";
        gameState.lastTime = 0;
    }
});

restartBtn.addEventListener("click", function() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.heart = 3;
    gameState.circle.speedY = 150;
    gameState.circle.r = 30; // 크기 초기화
    
    scoreSpan.textContent = gameState.score;
    updateHearts();
    resetCircle();
    gameState.lastTime = 0;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    startBtn.textContent = "게임 시작";
    pauseBtn.textContent = "일시정지";
    difficultySelect.disabled = false;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle();
});

canvas.addEventListener("mousedown", function(event) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    gameState.clickQueue.push({ x: clickX, y: clickY });
});

// 초기화
bestScoreSpan.textContent = gameState.bestScore;
updateHearts();
resetCircle();
drawCircle();
requestAnimationFrame(gameLoop);