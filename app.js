/* Simple Calculator with keyboard support, %, ±, backspace, and safe rounding */

const displayEl = document.getElementById("display");
const historyEl = document.getElementById("history");
const keys = document.querySelector(".keys");

let current = "0";         // current input as string
let previous = null;       // previous number as string
let operator = null;       // "plus" | "minus" | "multiply" | "divide"
let lastResult = null;     // last computed result (number)
let justEvaluated = false; // flag to start new number after equals

// Utility: clamp floating errors (round to 12 significant decimals)
function roundNice(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return value;
  // Round to 12 decimal digits to reduce IEEE-754 artifacts
  return Math.round(value * 1e12) / 1e12;
}

function setDisplay(text) {
  // Limit very long outputs
  const str = String(text);
  if (str.length > 18) {
    displayEl.textContent = Number(str).toExponential(8);
  } else {
    displayEl.textContent = str;
  }
}

function updateHistory() {
  if (previous !== null && operator) {
    const opSymbol = {
      plus: "+",
      minus: "−",
      multiply: "×",
      divide: "÷",
    }[operator];
    historyEl.textContent = `${previous} ${opSymbol}`;
  } else {
    historyEl.textContent = "";
  }
}

function clearAll() {
  current = "0";
  previous = null;
  operator = null;
  lastResult = null;
  justEvaluated = false;
  setDisplay(current);
  updateHistory();
}

function backspace() {
  if (justEvaluated) return; // do nothing right after equals
  if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
    current = "0";
  } else {
    current = current.slice(0, -1);
  }
  setDisplay(current);
}

function appendDigit(d) {
  if (justEvaluated) {
    // start new number after equals
    current = d === "." ? "0." : d;
    justEvaluated = false;
    setDisplay(current);
    return;
  }
  if (d === ".") {
    if (!current.includes(".")) current += ".";
    setDisplay(current);
    return;
  }
  if (current === "0") current = d;
  else current += d;
  setDisplay(current);
}

function chooseOperator(op) {
  if (operator && previous !== null && !justEvaluated) {
    // Chain operation: compute previous op first
    compute();
  }
  operator = op;
  previous = current;
  justEvaluated = false;
  updateHistory();
  // prepare for next number
  current = "0";
  setDisplay(current);
}

function toggleSign() {
  if (current === "0") return;
  if (current.startsWith("-")) current = current.slice(1);
  else current = "-" + current;
  setDisplay(current);
}

function percent() {
  // Converts current to percentage of 100
  const v = Number(current);
  const res = roundNice(v / 100);
  current = String(res);
  setDisplay(current);
}

function compute() {
  if (operator === null || previous === null) return;

  const a = Number(previous);
  const b = Number(current);

  let result;
  switch (operator) {
    case "plus":
      result = a + b;
      break;
    case "minus":
      result = a - b;
      break;
    case "multiply":
      result = a * b;
      break;
    case "divide":
      if (b === 0) {
        setDisplay("Cannot divide by 0");
        // Reset state so the user can continue
        current = "0";
        previous = null;
        operator = null;
        updateHistory();
        justEvaluated = true;
        return;
      }
      result = a / b;
      break;
    default:
      return;
  }

  result = roundNice(result);
  lastResult = result;
  current = String(result);
  previous = null;
  operator = null;
  setDisplay(current);
  updateHistory();
  justEvaluated = true;
}

keys.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const num = btn.getAttribute("data-num");
  const op = btn.getAttribute("data-op");
  const action = btn.getAttribute("data-action");

  if (num !== null) {
    appendDigit(num);
    return;
  }
  if (op) {
    if (op === "percent") {
      percent();
    } else if (["plus", "minus", "multiply", "divide"].includes(op)) {
      chooseOperator(op);
    }
    return;
  }
  if (action) {
    if (action === "clear") clearAll();
    else if (action === "backspace") backspace();
    else if (action === "decimal") appendDigit(".");
    else if (action === "sign") toggleSign();
    else if (action === "equals") compute();
  }
});

// Keyboard support
window.addEventListener("keydown", (e) => {
  const key = e.key;

  if (/\d/.test(key)) {
    appendDigit(key);
    return;
  }
  if (key === ".") { appendDigit("."); return; }
  if (key === "+" || key === "=" && e.shiftKey) { chooseOperator("plus"); return; }
  if (key === "-") { chooseOperator("minus"); return; }
  if (key === "*" || (key.toLowerCase() === "x")) { chooseOperator("multiply"); return; }
  if (key === "/") { chooseOperator("divide"); return; }
  if (key === "Enter" || key === "=") { e.preventDefault(); compute(); return; }
  if (key === "Backspace") { backspace(); return; }
  if (key === "Escape") { clearAll(); return; }
  if (key === "%") { percent(); return; }
});

clearAll(); // initialize
