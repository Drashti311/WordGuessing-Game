let secretWord = "";
let displayedWord = "";
let attemptsLeft = 0;
let score = 0;
let hintsUsed = 0;
const maxHints = 2;
let wordRevealed = false;
let gameOver = false;
let currentCategory = "";
let currentDifficulty = "";

// Scoreboard
let scoreboard = {
  Fruits: { total: 0 },
  Movies: { total: 0 },
  Songs: { total: 0 },
  Sports: { total: 0 },
  Animals: { total: 0 }
};

// Save and load
function saveScores() {
  localStorage.setItem("wordGameScoreboard", JSON.stringify(scoreboard));
}
function loadScores() {
  const stored = localStorage.getItem("wordGameScoreboard");
  if (stored) scoreboard = JSON.parse(stored);
  updateScoreboard();
}
loadScores();

// DOM elements
const welcomeScreen = document.getElementById("welcome-screen");
const selectionScreen = document.getElementById("selection-screen");
const gameSection = document.getElementById("game-section");
const scoreboardScreen = document.getElementById("scoreboard-screen");

const wordDisplay = document.getElementById("word-display");
const attemptsDisplay = document.getElementById("attempts");
const scoreDisplay = document.getElementById("score");
const guessInput = document.getElementById("guess-input");
const message = document.getElementById("message");

// Custom dropdown
const categoryDropdown = document.getElementById("category-dropdown");
const selected = categoryDropdown.querySelector(".selected");
const optionsContainer = categoryDropdown.querySelector(".options");

// Show message
function showMessage(msg) { message.textContent = msg; }

// Update display
function updateDisplay() {
  wordDisplay.textContent = displayedWord.split('').join(' ');
  attemptsDisplay.textContent = `Attempts Left: ${attemptsLeft} ❤️`;
  scoreDisplay.textContent = `Score: ${score}`;
}

// Navigation
document.getElementById("start-button").addEventListener("click", () => {
  resetGame();
  welcomeScreen.style.display = "none";
  selectionScreen.style.display = "block";
});
document.getElementById("scoreboard-button").addEventListener("click", () => {
  welcomeScreen.style.display = "none";
  scoreboardScreen.style.display = "block";
  updateScoreboard();
});
document.getElementById("back-to-welcome-from-scoreboard").addEventListener("click", () => {
  scoreboardScreen.style.display = "none";
  welcomeScreen.style.display = "block";
});
document.getElementById("back-to-welcome-from-selection").addEventListener("click", () => {
  selectionScreen.style.display = "none";
  welcomeScreen.style.display = "block";
});
document.getElementById("quit-button").addEventListener("click", () => {
  gameSection.style.display = "none";
  selectionScreen.style.display = "block";
  resetGame();
});

// Difficulty buttons
document.querySelectorAll(".difficulty").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".difficulty").forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = categoryDropdown.dataset.value || "Fruits";
    currentDifficulty = btn.dataset.level;
    startNextWord();
  });
});

// Custom dropdown functionality
selected.addEventListener("click", () => {
  optionsContainer.style.display = optionsContainer.style.display === "block" ? "none" : "block";
});
optionsContainer.querySelectorAll("div").forEach(option => {
  option.addEventListener("click", () => {
    selected.textContent = option.textContent;
    categoryDropdown.dataset.value = option.dataset.value;
    optionsContainer.style.display = "none";
  });
});
document.addEventListener("click", (e) => {
  if (!categoryDropdown.contains(e.target)) optionsContainer.style.display = "none";
});

// Reset game
function resetGame() {
  secretWord = displayedWord = "";
  attemptsLeft = score = hintsUsed = 0;
  wordRevealed = gameOver = false;
  guessInput.value = "";
  showMessage("");
  wordDisplay.textContent = "_ _ _ _";
  attemptsDisplay.textContent = `Attempts Left: 0 ❤️`;
  scoreDisplay.textContent = `Score: 0`;
}

// Start next word
function startNextWord() {
  gameOver = false;
  hintsUsed = 0;
  wordRevealed = false;
  guessInput.value = "";
  showMessage("");

  selectionScreen.style.display = "none";
  gameSection.style.display = "block";

  fetch(`categories/${currentCategory.toLowerCase()}.json`)
    .then(res => res.json())
    .then(data => {
      const list = data[currentDifficulty];
      secretWord = list[Math.floor(Math.random() * list.length)].toUpperCase();

      displayedWord = secretWord
        .split('')
        .map((c, i) => c === ' ' || i === 0 || i === secretWord.length - 1 || Math.random() < 0.2 ? c : '_')
        .join('');

      attemptsLeft = currentDifficulty === "easy" ? 5 : currentDifficulty === "medium" ? 4 : 3;

      updateDisplay();
    })
    .catch(err => showMessage("⚠️ Failed to load words!"));
}

// Handle guesses
function handleGuess() {
  if (gameOver) return;
  const guess = guessInput.value.toUpperCase();
  guessInput.value = "";
  if (!guess) return;
  guess.length === 1 ? handleLetterGuess(guess) : handleWordGuess(guess);
}
document.getElementById("guess-button").addEventListener("click", handleGuess);
guessInput.addEventListener("keyup", e => { if (e.key === "Enter") handleGuess(); });

function handleLetterGuess(letter) {
  let correct = false;
  displayedWord = displayedWord.split('').map((c, i) => {
    if (secretWord[i] === letter) { correct = true; return letter; }
    return c;
  }).join('');
  if (!correct) attemptsLeft--;
  checkGameStatus();
}

function handleWordGuess(word) {
  if (word === secretWord) {
    displayedWord = secretWord;
    score += currentDifficulty === "easy" ? 5 : currentDifficulty === "medium" ? 10 : 20;
  } else {
    attemptsLeft--;
    score = Math.max(0, score - 5);
    showMessage("❌ Wrong guess!");
  }
  checkGameStatus();
}

// Hint
document.getElementById("hint-button").addEventListener("click", () => {
  if (gameOver || hintsUsed >= maxHints) return showMessage("⚠️ No more hints!");
  hintsUsed++;
  revealOneLetter();
  score = Math.max(0, score - 2);
  updateDisplay();
});
function revealOneLetter() {
  for (let i = 0; i < secretWord.length; i++) {
    if (displayedWord[i] === "_") {
      displayedWord = displayedWord.substring(0, i) + secretWord[i] + displayedWord.substring(i + 1);
      updateDisplay();
      return;
    }
  }
}

// Reveal toggle
document.getElementById("reveal-button").addEventListener("click", () => {
  if (gameOver) return;
  if (!wordRevealed) {
    wordDisplay.textContent = secretWord;
    wordRevealed = true;
    showMessage("👀 Word Revealed!");
  } else {
    updateDisplay();
    wordRevealed = false;
    showMessage("🔒 Word Hidden!");
  }
});

// Next word
document.getElementById("next-word-button").addEventListener("click", startNextWord);

// Check game status
function checkGameStatus() {
  updateDisplay();
  if (displayedWord === secretWord) {
    showMessage("🏆 Congratulations! You guessed the word!");
    gameOver = true;
    scoreboard[currentCategory].total += score;
    updateScoreboard();

  } else if (attemptsLeft <= 0) {
    showMessage(`💔 Game Over! The word was: ${secretWord}`);
    gameOver = true;
  }
}

// Scoreboard
function updateScoreboard() {
  const scoreList = document.getElementById("score-list");
  scoreList.innerHTML = "";
  const emojis = { Fruits: "🍎", Movies: "🎬", Songs: "🎵", Sports: "⚽", Animals: "🐯" };
  for (const cat in scoreboard) {
    const li = document.createElement("li");
    li.textContent = `${cat} ${emojis[cat]}: ${scoreboard[cat].total}`;
    scoreList.appendChild(li);
  }
  saveScores();
}

// Clear scoreboard
document.getElementById("clear-scoreboard").addEventListener("click", () => {
  if (!confirm("Are you sure you want to clear the scoreboard?")) return;
  Object.keys(scoreboard).forEach(cat => scoreboard[cat].total = 0);
  updateScoreboard();
  showMessage("Scoreboard cleared!");
});
