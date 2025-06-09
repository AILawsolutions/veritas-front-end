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
let userAnswers = [];

document.getElementById("guided-tab").addEventListener("click", () => {
    switchTab("guided");
});
document.getElementById("ask-tab").addEventListener("click", () => {
    switchTab("ask");
});

document.getElementById("start-guided").addEventListener("click", startGuidedDrafting);
document.getElementById("guided-next").addEventListener("click", nextGuidedQuestion);
document.getElementById("ask-submit").addEventListener("click", submitAskVeritas);
document.getElementById("download-pdf").addEventListener("click", downloadEditedDocument);

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`${tab}-tab`).classList.add("active");

    document.getElementById("guided-section").classList.toggle("hidden", tab !== "guided");
    document.getElementById("ask-section").classList.toggle("hidden", tab !== "ask");
}

function startGuidedDrafting() {
    currentQuestionIndex = 0;
    userAnswers = [];
    showCurrentQuestion();
    document.getElementById("guided-question-section").classList.remove("hidden");
    document.getElementById("guided-preview-section").classList.add("hidden");
}

function showCurrentQuestion() {
    document.getElementById("guided-question").textContent = guidedQuestions[currentQuestionIndex];
    document.getElementById("guided-answer").value = "";
}

async function nextGuidedQuestion() {
    const answer = document.getElementById("guided-answer").value.trim();
    if (answer === "") return;

    userAnswers.push(answer);
    currentQuestionIndex++;

    if (currentQuestionIndex < guidedQuestions.length) {
        showCurrentQuestion();
    } else {
        await generateDocument();
    }
}

async function generateDocument() {
    document.getElementById("guided-question-section").classList.add("hidden");
    document.getElementById("guided-preview-section").classList.remove("hidden");
    document.getElementById("preview").innerHTML = "⏳ Generating document...";

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: userAnswers })
        });

        if (!response.ok) throw new Error("Server error");

        const blob = await response.blob();
        const text = await blob.text(); // Assuming server sends text content in PDF temporarily for preview
        document.getElementById("preview").innerText = text;

    } catch (error) {
        console.error(error);
        document.getElementById("preview").innerHTML = `<p style="color:red;">❌ Error generating document: ${error.message}</p>`;
    }
}

async function submitAskVeritas() {
    const prompt = document.getElementById("ask-input").value.trim();
    if (prompt === "") return;

    document.getElementById("ask-response").innerHTML = "⏳ Thinking...";

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt,
                state: "california", // default fallback
                county: "los angeles"
            })
        });

        if (!response.ok) throw new Error("Server error");

        const blob = await response.blob();
        const text = await blob.text();

        document.getElementById("ask-response").innerText = text;

    } catch (error) {
        console.error(error);
        document.getElementById("ask-response").innerHTML = `<p style="color:red;">❌ Error: ${error.message}</p>`;
    }
}

function downloadEditedDocument() {
    const editedContent = document.getElementById("preview").innerText;

    const blob = new Blob([editedContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "veritas_draft.pdf";
    link.click();

    URL.revokeObjectURL(url);
}
