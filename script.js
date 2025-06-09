const apiBase = "https://AiLawSolutions.pythonanywhere.com";

// --- Guided Drafting Flow ---

let currentQuestionIndex = 0;
let guidedAnswers = [];
let guidedQuestions = [];

async function loadGuidedQuestions() {
  const response = await fetch(`${apiBase}/questions`);
  const data = await response.json();
  guidedQuestions = data.questions;
  currentQuestionIndex = 0;
  guidedAnswers = new Array(guidedQuestions.length).fill("");

  showCurrentQuestion();
}

function showCurrentQuestion() {
  const container = document.getElementById("response-container");

  if (currentQuestionIndex < guidedQuestions.length) {
    container.innerHTML = `
      <div class="question-block">
        <p><strong>Question ${currentQuestionIndex + 1} of ${guidedQuestions.length}:</strong></p>
        <p>${guidedQuestions[currentQuestionIndex]}</p>
        <textarea id="answer-input" class="chat-input">${guidedAnswers[currentQuestionIndex]}</textarea>
        <div class="wizard-buttons">
          ${currentQuestionIndex > 0 ? `<button onclick="prevQuestion()">Back</button>` : ""}
          <button onclick="nextQuestion()">Next</button>
        </div>
      </div>
    `;
  } else {
    // All questions answered — show preview and Download button
    container.innerHTML = `
      <p><strong>All questions answered. Ready to generate your document.</strong></p>
      <button onclick="generateDocument()">Generate & Preview Document</button>
      <div id="preview-container"></div>
    `;
  }
}

function nextQuestion() {
  const input = document.getElementById("answer-input").value.trim();
  guidedAnswers[currentQuestionIndex] = input;

  if (currentQuestionIndex < guidedQuestions.length) {
    currentQuestionIndex++;
    showCurrentQuestion();
  }
}

function prevQuestion() {
  const input = document.getElementById("answer-input").value.trim();
  guidedAnswers[currentQuestionIndex] = input;

  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showCurrentQuestion();
  }
}

async function generateDocument() {
  const container = document.getElementById("preview-container");
  container.innerHTML = "<p>Generating document preview...</p>";

  try {
    const response = await fetch(`${apiBase}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: guidedAnswers }),
    });

    if (!response.ok) throw new Error("Server error generating document.");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    container.innerHTML = `
      <iframe src="${url}" width="100%" height="600px"></iframe>
      <a href="${url}" download="veritas_draft.pdf"><button>Download PDF</button></a>
    `;
  } catch (error) {
    container.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}

// --- Ask Veritas Flow ---

async function submitAskVeritas() {
  const prompt = document.getElementById("ask-input").value.trim();
  const askResponseContainer = document.getElementById("ask-response");

  if (!prompt) return;

  askResponseContainer.innerHTML = "<p>Generating response...</p>";

  try {
    const response = await fetch(`${apiBase}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, state: "", county: "" }),
    });

    if (!response.ok) throw new Error("Server error generating response.");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    askResponseContainer.innerHTML = `
      <iframe src="${url}" width="100%" height="600px"></iframe>
      <a href="${url}" download="veritas_response.pdf"><button>Download PDF</button></a>
    `;
  } catch (error) {
    askResponseContainer.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  // Start Guided Questions by default
  loadGuidedQuestions();

  // Tab switching (optional)
  document.getElementById("guided-tab").addEventListener("click", () => {
    loadGuidedQuestions();
    document.getElementById("guided-panel").style.display = "block";
    document.getElementById("ask-panel").style.display = "none";
  });

  document.getElementById("ask-tab").addEventListener("click", () => {
    document.getElementById("guided-panel").style.display = "none";
    document.getElementById("ask-panel").style.display = "block";
  });
});
