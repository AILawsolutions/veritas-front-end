// Veritas - script.js (Lexis Killer Version)

// API endpoint
const API_URL = "https://AiLawSolutions.pythonanywhere.com/generate-document";

// Guided questions (keep aligned with backend)
const questions = [
    "What type of document are you drafting? (e.g. Motion to Compel, Complaint)",
    "Which U.S. state is this case filed in?",
    "Which county in that state?",
    "What is the name of the court? (e.g. Superior Court of Los Angeles County)",
    "Who are the parties involved? (e.g. Plaintiff: Jane Smith; Defendant: Acme Corp)",
    "Summarize the key facts of the case:",
    "List the legal issues or arguments to be addressed:",
    "What is your desired outcome or conclusion?",
    "How would you like to sign the document? (Name and title)"
];

// State
let answers = [];
let currentQuestion = 0;

// DOM
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");

// Init
showMessage("Veritas", "Welcome to Veritas AI. Let's begin drafting your document.");
askNextQuestion();

// Handlers
submitButton.addEventListener("click", handleSubmit);
userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") handleSubmit();
});

// Functions
function showMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = sender === "Veritas" ? "veritas-message" : "user-message";
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function askNextQuestion() {
    if (currentQuestion < questions.length) {
        showMessage("Veritas", questions[currentQuestion]);
    } else {
        submitToBackend();
    }
}

function handleSubmit() {
    const input = userInput.value.trim();
    if (input === "") return;
    showMessage("You", input);
    answers.push(input);
    userInput.value = "";
    currentQuestion++;
    askNextQuestion();
}

function submitToBackend() {
    showMessage("Veritas", "Generating your court-ready document... ⏳");

    const payload = {
        answers: answers
    };

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Backend error. Please check your inputs and try again.");
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Veritas_Document.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        showMessage("Veritas", "✅ Document generated and downloaded. Ready to file.");
    })
    .catch(error => {
        console.error(error);
        showMessage("Veritas", "❌ An error occurred: " + error.message);
    });
}
