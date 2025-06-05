let currentQuestion = 0;
let answers = [];

const questions = [
  "What type of legal document do you want to create (e.g., Motion, Complaint, Contract)?",
  "What is the state of the court?",
  "What is the county of the court?",
  "What is the jurisdiction and court name?",
  "Who are the parties involved and their roles?",
  "Summarize the background facts relevant to this document.",
  "List the legal issues or claims to include.",
  "Do you want to request anything specific in the Conclusion?",
  "Attorney's full name, law firm, and contact info for the signature block?"
];

function showNextQuestion() {
  const questionLabel = document.getElementById("question");
  const inputField = document.getElementById("user-input");
  const button = document.getElementById("submit-button");
  const responseDiv = document.getElementById("response");

  if (currentQuestion < questions.length) {
    questionLabel.textContent = questions[currentQuestion];
    inputField.value = "";
    inputField.focus();
    responseDiv.innerHTML = "";
  } else {
    button.disabled = true;
    questionLabel.textContent = "⏳ Generating your legal document...";
    submitToBackend();
  }
}

function applyGlowingEffect(element) {
  element.style.backgroundColor = "#0f0";
  element.style.color = "#000";
  element.style.fontWeight = "bold";
  element.style.boxShadow = "0 0 20px #0f0, 0 0 30px #0f0";
  element.style.border = "none";
  element.style.padding = "12px 24px";
  element.style.borderRadius = "8px";
  element.style.cursor = "pointer";
}

async function submitToBackend() {
  const responseDiv = document.getElementById("response");

  const [docType, state, county, jurisdiction, parties, facts, issues, conclusion, attorney] = answers;
  const prompt = `Draft a ${docType} for a case filed in ${jurisdiction}, ${county}, ${state}. The parties are: ${parties}. Background: ${facts}. Legal issues: ${issues}. Requested conclusion: ${conclusion}. Attorney info: ${attorney}.`;

  const loadingInterval = startLoadingAnimation(responseDiv);

  try {
    const res = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,
        state: state.toLowerCase(),
        county: county.toLowerCase(),
        format: "pdf"
      })
    });

    clearInterval(loadingInterval);

    if (!res.ok) throw new Error("Server error");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Veritas_Document.pdf";
    applyGlowingEffect(a);
    a.textContent = "⬇️ Download Your Legal Document";
    document.body.appendChild(a);

    responseDiv.innerHTML = "✅ Your legal document is ready!";
  } catch (err) {
    clearInterval(loadingInterval);
    responseDiv.innerHTML = "❌ Error: " + err.message;
  }
}

function startLoadingAnimation(element) {
  let dots = 0;
  element.innerHTML = '<span class="typewriter">⏳ Veritas is generating your legal document</span>';
  const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    let trail = ".".repeat(dots) + "&nbsp;".repeat(3 - dots);
    element.querySelector(".typewriter").innerHTML = `⏳ Veritas is generating your legal document${trail}`;
  }, 500);
  return interval;
}

function handleSubmit() {
  const input = document.getElementById("user-input").value.trim();
  if (!input) return;

  answers.push(input);
  currentQuestion++;
  showNextQuestion();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submit-button").addEventListener("click", handleSubmit);
  showNextQuestion();
});
