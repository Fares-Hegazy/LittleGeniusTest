import { questionsBank } from './questions.js';

let studentName = "";
let selectedHomework = "";
let score = 0;
const selectedAnswers = [];

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
  const savedName = localStorage.getItem("studentName");
  if (savedName) {
    studentName = savedName;
    document.getElementById("name-section").classList.add("hidden");
    document.getElementById("homework-selection").classList.remove("hidden");
    document.getElementById("welcome-message").textContent = `Welcome, ${studentName}`;
  }
});

const startForm = document.getElementById("start-form");
if (!startForm) {
  console.error("Form with ID 'start-form' not found");
} else {
  startForm.addEventListener("submit", function (e) {
    e.preventDefault();
    console.log("Form submitted");
    const nameInput = document.getElementById("studentName");
    if (!nameInput) {
      console.error("Input with ID 'studentName' not found");
      return;
    }
    const nameValue = nameInput.value.trim();
    if (nameValue === "") {
      alert("Please enter your name.");
      return;
    }
    studentName = nameValue;
    localStorage.setItem("studentName", studentName);
    document.getElementById("name-section").classList.add("hidden");
    document.getElementById("homework-selection").classList.remove("hidden");
    document.getElementById("welcome-message").textContent = `Welcome, ${studentName}`;
  });
}

const startHwBtn = document.getElementById("start-hw-btn");
if (!startHwBtn) {
  console.error("Button with ID 'start-hw-btn' not found");
} else {
  startHwBtn.addEventListener("click", () => {
    console.log("Start homework button clicked");
    const hwSelect = document.getElementById("homeworkSelect");
    if (!hwSelect) {
      console.error("Select with ID 'homeworkSelect' not found");
      return;
    }
    const hwName = hwSelect.value;
    if (!hwName) {
      alert("Please select a homework.");
      return;
    }

    selectedHomework = hwName;
    const saved = JSON.parse(localStorage.getItem(`${studentName}_${selectedHomework}`));
    if (saved && saved.answers) {
      displaySavedAnswers(saved);
    } else {
      document.getElementById("homework-selection").classList.add("hidden");
      document.getElementById("quiz-section").classList.remove("hidden");
      document.getElementById("hw-title").textContent = `Homework: ${selectedHomework}`;
      showQuestions();
    }
  });
}

function showQuestions() {
  const container = document.getElementById("questions-container");
  if (!container) {
    console.error("Questions container not found");
    return;
  }
  container.innerHTML = "";
  score = 0;
  selectedAnswers.length = 0;

  questionsBank[selectedHomework].forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    const questionText = document.createElement("p");
    questionText.innerHTML = `<strong>${index + 1}.</strong><br>${q.question}`;
    questionDiv.appendChild(questionText);

    q.options.forEach(option => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () =>
        handleAnswer(button, option, q.answer, questionDiv, index)
      );
      questionDiv.appendChild(button);
    });

    container.appendChild(questionDiv);
  });
}

function handleAnswer(button, selected, correct, container, index) {
  const buttons = container.querySelectorAll("button");
  buttons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add("correct");
    else if (btn.textContent === selected) btn.classList.add("incorrect");
  });

  selectedAnswers[index] = selected;
  if (selected === correct) score++;

  localStorage.setItem(`${studentName}_${selectedHomework}`, JSON.stringify({
    name: studentName,
    homework: selectedHomework,
    score: score,
    answers: selectedAnswers,
    date: new Date().toLocaleString()
  }));

  const allAnswered = selectedAnswers.filter(Boolean).length === questionsBank[selectedHomework].length;
  if (allAnswered) {
    displayScore();
    submitToGoogleForm();
  }
}

function displayScore() {
  const scoreDisplay = document.getElementById("score-display");
  if (!scoreDisplay) {
    console.error("Score display element not found");
    return;
  }
  scoreDisplay.textContent = `${studentName}, your score is ${score} out of ${questionsBank[selectedHomework].length}`;
  document.getElementById("score-section").classList.remove("hidden");
}

function submitToGoogleForm() {
  localStorage.setItem(`${studentName}_${selectedHomework}`, JSON.stringify({
    name: studentName,
    homework: selectedHomework,
    score: score,
    answers: selectedAnswers,
    date: new Date().toLocaleString()
  }));

  const formUrl = new URL("https://docs.google.com/forms/d/e/1FAIpQLSesW6SP8E_oT6kHCB0-43l35WoWYNCMerjARJmhWvXfMvrJCw/formResponse");
  formUrl.searchParams.append("entry.1411546237", studentName);
  formUrl.searchParams.append("entry.1182907103", selectedHomework);
  formUrl.searchParams.append("entry.839954150", `${score}/${questionsBank[selectedHomework].length}`);
  formUrl.searchParams.append("entry.331380588", new Date().toLocaleString());

  fetch(formUrl.toString(), { method: "POST", mode: "no-cors" })
    .then(() => alert("✅ Your result was submitted!"))
    .catch(() => alert("❌ Submission error."));
}

function displaySavedAnswers(saved) {
  document.getElementById("homework-selection").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");
  document.getElementById("hw-title").textContent = `Homework: ${saved.homework}`;

  const container = document.getElementById("questions-container");
  if (!container) {
    console.error("Questions container not found");
    return;
  }
  container.innerHTML = "";
  selectedAnswers.length = 0;
  score = 0;

  questionsBank[saved.homework].forEach((q, index) => {
    const ans = saved.answers[index];
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");

    const questionText = document.createElement("p");
    questionText.innerHTML = `<strong>${index + 1}.</strong><br>${q.question}`;
    questionDiv.appendChild(questionText);

    q.options.forEach(option => {
      const button = document.createElement("button");
      button.textContent = option;

      if (ans) {
        button.disabled = true;
        if (option === q.answer) button.classList.add("correct");
        if (option === ans && option !== q.answer) button.classList.add("incorrect");
      } else {
        button.addEventListener("click", () =>
          handleAnswer(button, option, q.answer, questionDiv, index)
        );
      }

      questionDiv.appendChild(button);
    });

    container.appendChild(questionDiv);

    if (ans && ans === q.answer) score++;
    selectedAnswers[index] = ans || null;
  });

  const allAnswered = selectedAnswers.filter(Boolean).length === questionsBank[saved.homework].length;
  if (allAnswered) displayScore(); // Only display score, do not submit
}
