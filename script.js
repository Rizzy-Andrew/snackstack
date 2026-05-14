const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 500;

// PLAYER
const player = {
  x: 100,
  y: 100,
  size: 30,
  speed: 4,
  color: "orange"
};

let money = 100;

const moneyText = document.getElementById("money");
const log = document.getElementById("log");

function updateMoney() {
  moneyText.textContent = "Money: $" + money;
}

// INPUT
const keys = {};

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// MOVE PLAYER
function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // boundaries
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

// GAME LOOP
function loop() {
  movePlayer();
  draw();
  requestAnimationFrame(loop);
}

loop();
updateMoney();
