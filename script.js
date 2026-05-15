const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 500;

// ============================================
// GAME STATE
// ============================================
let money = 100;
let totalEarned = 0;
let gameTime = 0; // in seconds
let dayTime = 8 * 60; // 8:00 AM in minutes
let customers = [];
let nextCustomerId = 0;
let earningsPerMinute = 0;
let lastEarningsUpdate = Date.now();

// ============================================
// PLAYER
// ============================================
const player = {
  x: 100,
  y: 350,
  size: 25,
  speed: 3,
  color: "#ff6b35",
  name: "You"
};

// ============================================
// SIBLING HELPER
// ============================================
const sibling = {
  x: 150,
  y: 350,
  size: 25,
  speed: 2,
  color: "#3498db",
  name: "Your Sibling",
  target: null,
  isServing: false,
  servingTimer: 0
};

// ============================================
// FOOD TRUCK
// ============================================
const foodTruck = {
  x: 350,
  y: 200,
  width: 120,
  height: 80
};

// ============================================
// RECIPES & INGREDIENTS
// ============================================
const recipes = {
  burger: {
    name: "🍔 Burger",
    unlocked: true,
    ingredients: { chicken: 0, beef: 1, bun: 1 },
    price: 8,
    cost: 3
  },
  fries: {
    name: "🍟 Fries",
    unlocked: true,
    ingredients: { potato: 1, oil: 1 },
    price: 5,
    cost: 2
  },
  hotdog: {
    name: "🌭 Hot Dog",
    unlocked: false,
    ingredients: { sausage: 1, bun: 1 },
    price: 6,
    cost: 2.5,
    unlockCost: 200
  },
  tenders: {
    name: "🍗 Chicken Tenders",
    unlocked: false,
    ingredients: { chicken: 2, flour: 1, oil: 1 },
    price: 10,
    cost: 4,
    unlockCost: 300
  }
};

let ingredients = {
  chicken: 10,
  beef: 10,
  potato: 10,
  bun: 10,
  oil: 10,
  sausage: 0,
  flour: 0
};

// ============================================
// INPUT
// ============================================
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  
  // Serve customer on 'E' press
  if (e.key.toLowerCase() === 'e') {
    tryServeCustomer();
  }
});
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// ============================================
// CUSTOMER SYSTEM
// ============================================
class Customer {
  constructor(recipe) {
    this.id = nextCustomerId++;
    this.recipe = recipe;
    this.x = -50;
    this.y = 350;
    this.size = 25;
    this.speed = 1;
    this.targetX = foodTruck.x - 80;
    this.waiting = false;
    this.waitTimer = 0;
    this.maxWaitTime = 180; // 3 seconds at 60fps
    this.color = "#9b59b6";
    this.isServed = false;
  }
  
  update() {
    if (!this.waiting) {
      // Move toward truck
      if (this.x < this.targetX) {
        this.x += this.speed;
      } else {
        this.waiting = true;
      }
    } else {
      // Waiting for service
      this.waitTimer++;
      if (this.waitTimer > this.maxWaitTime && !this.isServed) {
        this.leave();
        return false; // Remove customer
      }
    }
    return true;
  }
  
  serve() {
    const recipe = recipes[this.recipe];
    
    // Check if we have ingredients
    let canMake = true;
    for (let ing in recipe.ingredients) {
      if (ingredients[ing] < recipe.ingredients[ing]) {
        canMake = false;
        break;
      }
    }
    
    if (!canMake) {
      updateLog("❌ Not enough ingredients for " + recipe.name + "!");
      return false;
    }
    
    // Deduct ingredients
    for (let ing in recipe.ingredients) {
      ingredients[ing] -= recipe.ingredients[ing];
    }
    
    // Add money
    money += recipe.price;
    totalEarned += recipe.price;
    this.isServed = true;
    updateLog("✅ Served " + recipe.name + " for $" + recipe.price);
    return true;
  }
  
  leave() {
    if (!this.isServed) {
      updateLog("😞 Customer left without ordering!");
    }
  }
  
  draw() {
    // Customer body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    
    // Order icon
    if (this.waiting) {
      ctx.font = "20px Arial";
      ctx.fillText(recipes[this.recipe].name.split(' ')[0], this.x - 5, this.y - 10);
      
      // Wait timer bar
      const barWidth = 30;
      const barHeight = 5;
      const fillWidth = (this.waitTimer / this.maxWaitTime) * barWidth;
      
      ctx.fillStyle = "#e74c3c";
      ctx.fillRect(this.x, this.y - 20, fillWidth, barHeight);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(this.x, this.y - 20, barWidth, barHeight);
    }
  }
}

function spawnCustomer() {
  // Only spawn if we have recipes unlocked
  const availableRecipes = Object.keys(recipes).filter(r => recipes[r].unlocked);
  if (availableRecipes.length === 0) return;
  
  // Random recipe
  const recipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
  customers.push(new Customer(recipe));
}

// Spawn customers periodically
setInterval(() => {
  if (Math.random() < 0.3 && customers.length < 5) {
    spawnCustomer();
  }
}, 2000);

// ============================================
// SERVING MECHANICS
// ============================================
function tryServeCustomer() {
  // Find nearest waiting customer
  let nearest = null;
  let minDist = 80;
  
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    if (c.waiting && !c.isServed) {
      const dx = player.x - c.x;
      const dy = player.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        nearest = c;
        minDist = dist;
      }
    }
  }
  
  if (nearest) {
    if (nearest.serve()) {
      setTimeout(() => {
        customers = customers.filter(c => c.id !== nearest.id);
      }, 500);
    }
  }
}

// Sibling AI
function updateSibling() {
  if (sibling.isServing) {
    sibling.servingTimer++;
    if (sibling.servingTimer > 60) { // 1 second serve time
      sibling.isServing = false;
      sibling.servingTimer = 0;
      if (sibling.target) {
        if (sibling.target.serve()) {
          setTimeout(() => {
            customers = customers.filter(c => c.id !== sibling.target.id);
          }, 500);
        }
        sibling.target = null;
      }
    }
    return;
  }
  
  // Find a customer to serve
  let target = null;
  for (let c of customers) {
    if (c.waiting && !c.isServed) {
      target = c;
      break;
    }
  }
  
  if (target) {
    sibling.target = target;
    const dx = sibling.x - target.x;
    const dy = sibling.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 40) {
      // Move toward customer
      const angle = Math.atan2(target.y - sibling.y, target.x - sibling.x);
      sibling.x += Math.cos(angle) * sibling.speed;
      sibling.y += Math.sin(angle) * sibling.speed;
    } else {
      // Start serving
      sibling.isServing = true;
      sibling.servingTimer = 0;
    }
  } else {
    // Idle - move back to truck
    const dx = sibling.x - 150;
    const dy = sibling.y - 350;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      const angle = Math.atan2(350 - sibling.y, 150 - sibling.x);
      sibling.x += Math.cos(angle) * sibling.speed;
      sibling.y += Math.sin(angle) * sibling.speed;
    }
  }
}

// ============================================
// PLAYER MOVEMENT
// ============================================
function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;
  
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

// ============================================
// DRAWING
// ============================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, "#87CEEB");
  skyGrad.addColorStop(0.7, "#90EE90");
  skyGrad.addColorStop(1, "#8B7355");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Ground
  ctx.fillStyle = "#8B7355";
  ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
  
  // Food Truck
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(foodTruck.x, foodTruck.y, foodTruck.width, foodTruck.height);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(foodTruck.x, foodTruck.y + 50, foodTruck.width, 30);
  
  // Truck wheels
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(foodTruck.x + 30, foodTruck.y + 80, 12, 0, Math.PI * 2);
  ctx.arc(foodTruck.x + 90, foodTruck.y + 80, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Truck window
  ctx.fillStyle = "#3498db";
  ctx.fillRect(foodTruck.x + 20, foodTruck.y + 10, 80, 35);
  
  // Truck sign
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Snack StacK", foodTruck.x + 25, foodTruck.y + 32);
  
  // Customers
  customers.forEach(c => c.draw());
  
  // Sibling
  ctx.fillStyle = sibling.color;
  ctx.fillRect(sibling.x, sibling.y, sibling.size, sibling.size);
  ctx.fillStyle = "#fff";
  ctx.font = "10px Arial";
  ctx.fillText("SIB", sibling.x + 2, sibling.y + 17);
  
  if (sibling.isServing) {
    ctx.fillStyle = "#2ecc71";
    ctx.fillText("Serving...", sibling.x - 10, sibling.y - 10);
  }
  
  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText("YOU", player.x + 2, player.y + 17);
  
  // Serve prompt
  let nearCustomer = null;
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (c.waiting && !c.isServed && dist < 80) {
      nearCustomer = c;
      break;
    }
  }
  
  if (nearCustomer) {
    ctx.fillStyle = "#2ecc71";
    ctx.font = "16px Arial";
    ctx.fillText("Press E to Serve", player.x - 30, player.y - 15);
  }
}

// ============================================
// UI UPDATES
// ============================================
function updateUI() {
  document.getElementById("money").textContent = "Money: $" + Math.floor(money);
  document.getElementById("earnings").textContent = "Earnings/min: $" + earningsPerMinute;
  
  // Time
  const hours = Math.floor(dayTime / 60);
  const mins = dayTime % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours;
  document.getElementById("day").textContent = `Day 1 - ${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  
  // Recipes
  let recipesHTML = "";
  for (let key in recipes) {
    const r = recipes[key];
    if (r.unlocked) {
      recipesHTML += `<div class="recipe-unlocked">${r.name} - $${r.price}</div>`;
    } else {
      recipesHTML += `<div class="recipe-locked">${r.name} (Unlock: $${r.unlockCost})</div>`;
    }
  }
  document.getElementById("recipes").innerHTML = recipesHTML;
  
  // Ingredients
  let ingHTML = "";
  for (let ing in ingredients) {
    const emoji = {chicken:"🐔", beef:"🥩", potato:"🥔", bun:"🍞", oil:"🛢️", sausage:"🌭", flour:"🌾"};
    ingHTML += `<div>${emoji[ing] || ing}: ${ingredients[ing]}</div>`;
  }
  document.getElementById("ingredients").innerHTML = ingHTML;
  
  // Team
  document.getElementById("team").innerHTML = `
    <div>👤 ${player.name}</div>
    <div>👥 ${sibling.name} (Helper)</div>
  `;
  
  // Show upgrade button at $5000
  if (money >= 5000) {
    document.getElementById("upgradeBtn").style.display = "inline-block";
  }
}

function updateLog(msg) {
  document.getElementById("log").textContent = msg;
}

// ============================================
// BUTTONS
// ============================================
document.getElementById("buyIngredientsBtn").addEventListener("click", () => {
  if (money >= 50) {
    money -= 50;
    ingredients.chicken += 5;
    ingredients.beef += 5;
    ingredients.potato += 5;
    ingredients.bun += 5;
    ingredients.oil += 5;
    updateLog("✅ Bought ingredients!");
  } else {
    updateLog("❌ Not enough money!");
  }
});

document.getElementById("upgradeBtn").addEventListener("click", () => {
  if (money >= 5000) {
    updateLog("🎉 Congratulations! Restaurant upgrade coming in next version!");
    // This would unlock the restaurant phase
  }
});

// ============================================
// EARNINGS CALCULATION
// ============================================
function calculateEarnings() {
  const now = Date.now();
  const elapsed = (now - lastEarningsUpdate) / 1000; // seconds
  
  if (elapsed >= 60) { // Every minute
    earningsPerMinute = Math.floor((totalEarned / gameTime) * 60);
    lastEarningsUpdate = now;
  }
}

// ============================================
// GAME LOOP
// ============================================
function loop() {
  try {
    movePlayer();
    updateSibling();
    
    // Update customers
    customers = customers.filter(c => c.update());
    
    // Remove served customers
    customers = customers.filter(c => !c.isServed);
    
    draw();
    updateUI();
    
    // Game time
    gameTime += 1/60;
    dayTime += 0.1; // Time passes
    
    calculateEarnings();
    
    requestAnimationFrame(loop);
  } catch (error) {
    console.error("Game loop error:", error);
    document.getElementById("log").textContent = "Error: " + error.message + " (Check console F12)";
  }
}

// ============================================
// START GAME
// ============================================
if (!canvas || !ctx) {
  alert("Canvas failed to load! Make sure you have a canvas element with id='game'");
} else {
  console.log("Game starting...");
  loop();
  updateLog("Welcome to Snack StacK! Serve customers to earn money!");
}
