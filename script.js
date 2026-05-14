let money = 100;

const moneyText = document.getElementById("money");
const log = document.getElementById("log");

function updateMoney() {
  moneyText.textContent = "Money: $" + money;
}

document.getElementById("burgerBtn").addEventListener("click", function() {

  log.textContent = "Cooking burger...";

  setTimeout(function() {

    money += 15;

    updateMoney();

    log.textContent = "Sold burger for $15!";

  }, 2000);

});

document.getElementById("friesBtn").addEventListener("click", function() {

  log.textContent = "Cooking fries...";

  setTimeout(function() {

    money += 8;

    updateMoney();

    log.textContent = "Sold fries for $8!";

  }, 1500);

});
