/* =========================================
   GOLDEN NEST - JAVASCRIPT
   Browser-only demonstration version.
========================================= */

/* ACCOUNT DATA */
let balance = Number(localStorage.getItem("atelier")) || 0;
let history = [];

try {
  history = JSON.parse(localStorage.getItem("atelier_history") || "[]");
  if (!Array.isArray(history)) history = [];
} catch (error) {
  history = [];
}

let chosenMode = "";
let toastTimer;
let selectedInvestment = null;

/* SAVE DATA */
function saveData() {
  localStorage.setItem("atelier", String(balance));
  localStorage.setItem("atelier_history", JSON.stringify(history));
}

/* FORMAT MONEY */
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* MOBILE MENU */
function toggleMenu() {
  const menu = document.getElementById("mainMenu");
  const toggle = document.getElementById("menuToggle");
  if (!menu || !toggle) return;

  const isOpen = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? "✕ Close" : "☰ Menu";
}

/* PAGE NAVIGATION */
function showPage(id) {
  const target = document.getElementById(id);

  if (!target) {
    console.warn("Page not found:", id);
    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  target.classList.add("active");
  document.body.classList.toggle("home-page", id === "dashboard");

  const menu = document.getElementById("mainMenu");
  const toggle = document.getElementById("menuToggle");

  if (menu) menu.classList.remove("open");

  if (toggle) {
    toggle.textContent = "☰ Menu";
    toggle.setAttribute("aria-expanded", "false");
  }

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.remove("active");
  });

  const navButton = Array.from(document.querySelectorAll(".nav-link")).find(button => {
    const action = button.getAttribute("onclick") || "";
    return action.includes("'" + id + "'");
  });

  if (navButton) navButton.classList.add("active");

  target.querySelectorAll(".fade, .box-fade").forEach(element => {
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
  });

  updateBalance();
  updateDashboardStats();

  if (id === "history") drawList("fullList");
  if (id === "dashboard") drawList("dashList", 4);
  if (id === "invest") drawInvestmentList();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* BALANCE */
function updateBalance() {
  document.querySelectorAll(".bal").forEach(element => {
    element.textContent = "$" + formatMoney(balance);
  });

  updateDashboardStats();
}

/* DASHBOARD STATISTICS */
function updateDashboardStats() {
  const completed = history.filter(item =>
    String(item.status).toLowerCase() === "completed"
  );

  const invested = completed
    .filter(item => item.type === "Purchase")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalProfit = completed
    .filter(item => item.type === "Profit")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalBonus = completed
    .filter(item => item.type === "Bonus")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalDeposit = completed
    .filter(item => item.type === "Deposit")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const values = {
    portfolioValue: balance + invested,
    profitValue: totalProfit,
    bonusValue: totalBonus,
    dashboardDeposit: totalDeposit
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = "$" + formatMoney(value);
  });
}

/* TRANSACTION HISTORY */
function drawList(elementId, limit = null) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  const list = limit
    ? history.slice(-limit).reverse()
    : history.slice().reverse();

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small";
    empty.style.padding = "15px 0";
    empty.textContent = "No transactions yet.";
    container.appendChild(empty);
    return;
  }

  list.forEach(item => {
    const row = document.createElement("div");
    row.className = "item";

    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.type || "Transaction";

    const details = document.createElement("div");
    details.className = "small";
    details.textContent =
      (item.mode || "") + (item.date ? " • " + item.date : "");

    left.appendChild(title);
    left.appendChild(details);

    const right = document.createElement("div");
    const amount = document.createElement("div");
    amount.textContent = "$" + formatMoney(item.amount);

    const status = document.createElement("div");
    status.className = "small";
    status.textContent = item.status || "Pending";

    right.appendChild(amount);
    right.appendChild(status);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

/* INVESTMENT ACTIVITY */
function drawInvestmentList() {
  const container = document.getElementById("investmentList");
  if (!container) return;

  container.innerHTML = "";

  const investments = history
    .filter(item => item.type === "Purchase")
    .slice()
    .reverse();

  if (investments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small";
    empty.textContent = "No investment activity recorded yet.";
    container.appendChild(empty);
    return;
  }

  investments.forEach(item => {
    const card = document.createElement("div");
    card.className = "item";

    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.mode || "Investment Plan";

    const details = document.createElement("div");
    details.className = "small";

    const period = item.ratePeriod || "daily";
    const rateText = Number(item.rate || 0) > 0
      ? Number(item.rate) + "% stated " + period + " rate"
      : "Rate not specified";

    details.textContent =
      rateText + (item.duration ? " • " + item.duration + " days" : "");

    left.appendChild(title);
    left.appendChild(details);

    const right = document.createElement("div");
    const amount = document.createElement("div");
    amount.textContent = "$" + formatMoney(item.amount);

    const status = document.createElement("div");
    status.className = "small";
    status.textContent = item.status || "Pending";

    right.appendChild(amount);
    right.appendChild(status);

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  });
}

/* PAYMENT METHOD SELECTION */
function chooseMode(button, mode) {
  chosenMode = mode;

  const activePage = document.querySelector(".page.active");
  if (!activePage) return;

  activePage.querySelectorAll(".mode").forEach(element => {
    element.classList.remove("selected");
  });

  if (button) button.classList.add("selected");
}

/* PAYMENT ADDRESSES */
const addresses = {
  Bitcoin: "bc1q75kl43x0fhtngf3pah9rt2cmf3l8pajfvdq3h8",
  TRON: "TSHu7uhBUS6MLwGJmoDsU5vGf8xZ27gxRD",
  USDT: "0x2A9c14b37622424a99a07F0B0a76aa27A4D770A6",
  Ethereum: "0x2A9c14b37622424a99a07F0B0a76aa27A4D770A6",
  Litecoin: "ltc1qlh3p6h8jceg3j2tgmhw824ca04pgr5l0wan98c",
  "Bank Transfer": "YOUR BANK / YOUR NAME / 0000000000"
};

/* UPDATE PAYMENT ADDRESS BY NETWORK */
function updatePaymentAddress() {
  const addressBox = document.getElementById("addressBox");
  const networkSelect = document.getElementById("networkSelect");
  if (!addressBox || !networkSelect) return;

  let address = "";

  if (chosenMode === "Bitcoin") {
    address = addresses.Bitcoin;
  } else if (chosenMode === "USDT") {
    const network = networkSelect.value;

    if (network === "TRC20") {
      address = addresses.TRON;
    } else if (network === "ERC20") {
      address = addresses.USDT;
    } else if (network === "BEP20") {
      address = "BEP20 payment address has not been provided.";
    }
  } else if (chosenMode === "Ethereum") {
    address = addresses.Ethereum;
  } else if (chosenMode === "Litecoin") {
    address = addresses.Litecoin;
  } else if (chosenMode === "Bank Transfer") {
    address = addresses["Bank Transfer"];
  }

  addressBox.textContent = address || "Payment details unavailable.";
}

/* PROCEED TO PAYMENT */
function proceedPayment() {
  const amountInput = document.getElementById("depAmount");
  if (!amountInput) return;

  const amount = Number(amountInput.value);

  if (!amount || amount <= 0) {
    showMessage("Please enter a valid deposit amount.");
    return;
  }

  if (!chosenMode) {
    showMessage("Please select a payment method.");
    return;
  }

  const payMethod = document.getElementById("payMethod");
  const payAmount = document.getElementById("payAmount");
  const networkBox = document.getElementById("payNetwork");
  const networkSelect = document.getElementById("networkSelect");

  if (payMethod) payMethod.textContent = chosenMode;
  if (payAmount) payAmount.textContent = "$" + formatMoney(amount);

  const cryptoMethods = ["Bitcoin", "USDT", "Ethereum", "Litecoin"];

  if (networkBox) {
    networkBox.style.display = cryptoMethods.includes(chosenMode)
      ? "block"
      : "none";
  }

  if (networkSelect) {
    if (chosenMode === "USDT") networkSelect.value = "TRC20";
    else if (chosenMode === "Bitcoin") networkSelect.value = "Bitcoin";
    else if (chosenMode === "Ethereum") networkSelect.value = "Ethereum";
    else if (chosenMode === "Litecoin") networkSelect.value = "Litecoin";
  }

  updatePaymentAddress();
  showPage("pay");
}

/* COPY PAYMENT ADDRESS */
function copyAddress() {
  const addressBox = document.getElementById("addressBox");
  if (!addressBox) return;

  const address = addressBox.textContent.trim();

  if (
    !address ||
    address.includes("not been provided") ||
    address.includes("unavailable")
  ) {
    showMessage("A valid payment address is not available.");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(address)
      .then(() => showMessage("Payment details copied successfully."))
      .catch(() => showMessage("Unable to copy. Please copy manually."));
  } else {
    showMessage("Please copy the payment details manually.");
  }
}

/* RECEIPT FILE NAME */
function showFileName() {
  const fileInput = document.getElementById("receiptFile");
  const fileName = document.getElementById("fileName");
  if (!fileInput || !fileName) return;

  fileName.textContent = fileInput.files.length
    ? fileInput.files[0].name
    : "No file selected";
}

/* SUBMIT DEPOSIT RECEIPT */
function submitReceipt() {
  const fileInput = document.getElementById("receiptFile");
  const payAmount = document.getElementById("payAmount");

  const amount = Number(
    payAmount?.textContent.replace(/[$,]/g, "") || 0
  );

  if (!amount || amount <= 0) {
    showMessage("Invalid deposit amount.");
    return;
  }

  if (!chosenMode) {
    showMessage("Please select a payment method.");
    return;
  }

  if (!fileInput || !fileInput.files.length) {
    showMessage("Please upload your payment receipt.");
    return;
  }

  const file = fileInput.files[0];

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Receipt must be smaller than 5MB.");
    return;
  }

  history.push({
    id: Date.now(),
    type: "Deposit",
    amount,
    mode: chosenMode,
    receiptName: file.name,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  saveData();

  fileInput.value = "";

  const fileName = document.getElementById("fileName");
  if (fileName) fileName.textContent = "No file selected";

  const depAmount = document.getElementById("depAmount");
  if (depAmount) depAmount.value = "";

  chosenMode = "";

  document.querySelectorAll(".mode").forEach(button => {
    button.classList.remove("selected");
  });

  drawList("dashList", 4);
  drawList("fullList");
  updateDashboardStats();

  showMessage("Receipt submitted. Awaiting verification.");
  showPage("history");
}

/* DEPOSIT VERIFICATION NOTICE */
function confirmDeposit() {
  showMessage("Deposits must be verified by an authorised administrator.");
}

/* WITHDRAWAL REQUEST */
function doWithdraw() {
  const amountInput = document.getElementById("wAmount");
  const addressInput = document.getElementById("wAddress");
  const networkInput = document.getElementById("wNetwork");

  if (!amountInput || !addressInput) return;

  const amount = Number(amountInput.value);
  const address = addressInput.value.trim();

  if (!amount || amount <= 0) {
    showMessage("Enter a valid withdrawal amount.");
    return;
  }

  if (amount > balance) {
    showMessage("Insufficient balance.");
    return;
  }

  if (!address) {
    showMessage("Enter your withdrawal wallet address.");
    return;
  }

  const confirmed = confirm(
    "Submit a withdrawal request for $" + formatMoney(amount) + "?"
  );

  if (!confirmed) return;

  // Demo behavior: the amount is reserved locally while the request is pending.
  balance -= amount;

  history.push({
    id: Date.now(),
    type: "Withdrawal",
    amount,
    mode: networkInput ? networkInput.value : "",
    address,
    status: "Pending",
    date: new Date().toLocaleString()
  });

  saveData();
  updateBalance();
  drawList("dashList", 4);
  drawList("fullList");

  amountInput.value = "";
  addressInput.value = "";

  showMessage("Withdrawal request submitted.");
  showPage("history");
}

/* RECORD A PLAN PURCHASE — EXPLORE PLANS */
function buyItem(name, amount, rate = 0, duration = 0, ratePeriod = "daily") {
  amount = Number(amount);
  rate = Number(rate);

  if (!amount || amount <= 0) {
    showMessage("Invalid plan amount.");
    return;
  }

  if (balance < amount) {
    showMessage("Insufficient balance. Please deposit first.");
    showPage("deposit");
    return;
  }

  const confirmed = confirm(
    "Do you want to choose " + name + " for $" + formatMoney(amount) + "?"
  );

  if (!confirmed) return;

  recordInvestment(name, amount, rate, duration, ratePeriod);
}

/* OPEN SEPARATE INVESTMENT AMOUNT PAGE */
function openInvestForm(name, minimum, maximum, rate, duration, ratePeriod = "daily") {
  selectedInvestment = {
    name,
    minimum: Number(minimum),
    maximum: Number(maximum),
    rate: Number(rate),
    duration: Number(duration),
    ratePeriod
  };

  const title = document.getElementById("selectedPlanName");
  const summary = document.getElementById("selectedPlanSummary");
  const terms = document.getElementById("selectedPlanTerms");
  const range = document.getElementById("investAmountRange");
  const amountInput = document.getElementById("investAmount");

  if (title) title.textContent = name;
  if (summary) summary.textContent = name;

  if (terms) {
    terms.textContent = rate + "% " + ratePeriod +
      " • Duration: " + duration + " days";
  }

  if (range) {
    range.textContent = "Minimum: $" + formatMoney(minimum) +
      " | Maximum: $" + formatMoney(maximum);
  }

  if (amountInput) {
    amountInput.value = "";
    amountInput.min = String(minimum);
    amountInput.max = String(maximum);
    amountInput.placeholder = "Enter an amount from $" +
      formatMoney(minimum) + " to $" + formatMoney(maximum);
  }

  showPage("invest-form");
}

/* SUBMIT INVESTMENT FROM AMOUNT PAGE */
function submitInvestment() {
  if (!selectedInvestment) {
    showMessage("Please select an investment plan first.");
    showPage("invest");
    return;
  }

  const amountInput = document.getElementById("investAmount");
  const amount = Number(amountInput ? amountInput.value : 0);

  const {
    name,
    minimum,
    maximum,
    rate,
    duration,
    ratePeriod
  } = selectedInvestment;

  if (!Number.isFinite(amount) || amount < minimum || amount > maximum) {
    showMessage(
      "Enter an amount between $" + formatMoney(minimum) +
      " and $" + formatMoney(maximum) + "."
    );
    return;
  }

  if (balance < amount) {
    showMessage("Insufficient balance. Please deposit funds first.");
    return;
  }

  const confirmed = confirm(
    "Submit your investment request?\n\n" +
    "Plan: " + name + "\n" +
    "Amount: $" + formatMoney(amount) + "\n" +
    "Advertised rate: " + rate + "% " + ratePeriod + "\n" +
    "Duration: " + duration + " days\n\n" +
    "The request will remain pending until an authorised administrator approves it."
  );

  if (!confirmed) return;

  recordInvestment(name, amount, rate, duration, ratePeriod);
}

/* SHARED INVESTMENT RECORD */
function recordInvestment(name, amount, rate, duration, ratePeriod) {
  if (balance < amount) {
    showMessage("Insufficient balance.");
    return;
  }

  // Front-end demo: a request is pending until a real admin approves it.
  balance -= amount;

  history.push({
    id: Date.now(),
    type: "Purchase",
    amount,
    mode: name,
    rate,
    ratePeriod,
    duration,
    status: "Pending Approval",
    date: new Date().toLocaleString()
  });

  saveData();
  updateBalance();
  updateDashboardStats();
  drawList("dashList", 4);
  drawList("fullList");
  drawInvestmentList();

  selectedInvestment = null;

  showMessage("Investment request submitted. Awaiting admin approval.");
  showPage("invest");
}

/* TOAST MESSAGE */
function showMessage(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* INITIALIZE WEBSITE */
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const networkSelect = document.getElementById("networkSelect");

  if (networkSelect) {
    networkSelect.addEventListener("change", updatePaymentAddress);
  }

  updateBalance();
  updateDashboardStats();
  drawList("dashList", 4);
  drawList("fullList");
  drawInvestmentList();

  showPage("dashboard");
});

// Theme

/* =====================================
   DARK MODE / LIGHT MODE
===================================== */

function setTheme(theme) {
  const dark = theme === "dark";

  document.body.classList.toggle("dark-mode", dark);

  const button = document.getElementById("themeToggle");

  if (button) {
    button.textContent = dark
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  }

  localStorage.setItem("goldenNestTheme", theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark-mode");

  setTheme(isDark ? "light" : "dark");
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("goldenNestTheme");

  setTheme(savedTheme || "light");

  const button = document.getElementById("themeToggle");

  if (button) {
    button.addEventListener("click", toggleTheme);
  }
}

document.addEventListener("DOMContentLoaded", initializeTheme);