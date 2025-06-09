const guidedQuestions = [
  "What type of document are you drafting? (e.g., Motion, Notice, Complaint)",
  "Which state is this court located in?",
  "Which county is this court located in?",
  "Which specific court is this for? (full court name)",
  "Who are the parties involved in this case?",
  "Summarize the key facts of the case.",
  "What are the legal issues involved?",
  "What conclusion or relief are you seeking from the court?",
  "What is the attorney signature block? (name, firm, address, contact)"
];

let currentQuestionIndex = 0;
let answers = [];

function showTab(tab) {
  document.getElementById("guided-panel").style.display = (tab === "guided") ? "block" : "none";
  document.getElementById("chat-panel").style.display = (tab === "chat") ? "block" : "none";

  document.getElementById("guided-tab").classList.toggle("active", tab === "guided");
  document.getElementById("chat-tab").classList.toggle("active", tab === "chat");
}

function showNextQuestion() {
  if (currentQuestionIndex < guidedQuestions.length) {
    document.getElementById("guided-question-container").innerHTML = `<p>${guidedQuestions[currentQuestionIndex]}</p>`;
    document.getElementById("guided-answer").value = "";
  } else {
    document.getElementById("guided-question-container").style.display = "none";
    document.getElementById("guided-answer").style.display = "none";
    document.querySelector(".chat-actions").style.display = "none";
    document.getElementById("guided-summary").style.display = "block";

    let reviewHTML = "";
    guidedQuestions.forEach((q, i) => {
      reviewHTML += `<p><strong>${q}</strong><br>${answers[i]}</p>`;
    });
    document.getElementById("guided-review").innerHTML = reviewHTML;
  }
}

function submitGuidedAnswer() {
  const answer = document.getElementById("guided-answer").value.trim();
  if (answer === "") return;

  answers.push(answer);
  currentQuestionIndex++;
  showNextQuestion();
}

function generateDocument() {
  fetch("https://AiLawSolutions.pythonanywhere.com/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  })
  .then(response => response.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    document.getElementById("preview-container").style.display = "block";
    document.getElementById("document-preview").src = url;
    window.generatedDocumentUrl = url;
  })
  .catch(err => alert("Error generating document: " + err.message));
}

function downloadDocument() {
  const link = document.createElement("a");
  link.href = window.generatedDocumentUrl;
  link.download = "veritas_draft.pdf";
  link.click();
}

function submitChat() {
  const input = document.getElementById("chat-input").value.trim();
  if (input === "") return;

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML += `<div class="user-message">${input}</div>`;
  document.getElementById("chat-input").value = "";
  chatMessages.scrollTop = chatMessages.scrollHeight;

  fetch("https://AiLawSolutions.pythonanywhere.com/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input, state: "default", county: "default" })
  })
  .then(response => response.blob())
  .then(blob => blob.text())
  .then(text => {
    chatMessages.innerHTML += `<div class="bot-message">${text}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  })
  .catch(err => {
    chatMessages.innerHTML += `<div class="bot-message">Error: ${err.message}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

window.onload = showNextQuestion;
