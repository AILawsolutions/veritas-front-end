// EXISTING Quick Analyze (keep working)
async function submitPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  const file = document.getElementById('file-upload').files[0];
  const status = document.getElementById('status');
  const responseContainer = document.getElementById('response-container');

  status.textContent = '⏳ Drafting your document...';
  responseContainer.innerHTML = '';

  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);
      formData.append("state", "california");
      formData.append("county", "los angeles");
      formData.append("format", "pdf");

      response = await fetch("https://AiLawSolutions.pythonanywhere.com/analyze-upload", {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch("https://AiLawSolutions.pythonanywhere.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          state: "california",
          county: "los angeles",
          format: "pdf"
        }),
      });
    }

    if (!response.ok) throw new Error("Server error");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "veritas_draft.pdf";
    link.click();

    status.textContent = "✅ Document ready and downloaded.";
    responseContainer.innerHTML = `<p><strong>Success!</strong> Your court document has been downloaded.</p>`;
  } catch (error) {
    console.error(error);
    status.textContent = "❌ Error generating document.";
    responseContainer.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}

// -------------------
// NEW: Guided Questions Flow
// -------------------

let guidedAnswers = [];
let guidedQuestions = [];
let currentQuestionIndex = 0;

// Start guided flow
async function startGuidedQuestions() {
  guidedAnswers = [];
  currentQuestionIndex = 0;

  const response = await fetch('https://AiLawSolutions.pythonanywhere.com/questions');
  const data = await response.json();
  guidedQuestions = data.questions;

  document.getElementById('guided-question-container').style.display = 'block';
  showCurrentQuestion();
}

// Show the current question
function showCurrentQuestion() {
  document.getElementById('guided-question').innerText = guidedQuestions[currentQuestionIndex];
  document.getElementById('guided-answer').value = '';
  document.getElementById('guided-status').innerText = `Question ${currentQuestionIndex + 1} of ${guidedQuestions.length}`;
}

// Go to next question or submit
async function nextGuidedQuestion() {
  const answer = document.getElementById('guided-answer').value.trim();
  if (answer === '') {
    alert("Please enter an answer before continuing.");
    return;
  }

  guidedAnswers.push(answer);

  currentQuestionIndex++;

  if (currentQuestionIndex < guidedQuestions.length) {
    showCurrentQuestion();
  } else {
    // Done, submit answers to /generate
    document.getElementById('guided-status').innerText = "⏳ Generating your document...";
    await submitGuidedAnswers();
  }
}

// Submit answers and show preview
async function submitGuidedAnswers() {
  try {
    const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: guidedAnswers })
    });

    if (!response.ok) throw new Error("Server error");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Show preview iframe
    const previewFrame = document.getElementById('pdf-preview');
    previewFrame.src = url;
    previewFrame.style.display = 'block';

    // Show download button
    const downloadButton = document.getElementById('download-btn');
    downloadButton.href = url;
    downloadButton.style.display = 'inline-block';

    document.getElementById('guided-status').innerText = "✅ Document ready!";
  } catch (error) {
    console.error(error);
    document.getElementById('guided-status').innerText = "❌ Error generating document.";
  }
}
