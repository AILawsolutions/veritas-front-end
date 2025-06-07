document.addEventListener("DOMContentLoaded", function () {
    const statusEl = document.getElementById("status");
    const formEl = document.getElementById("answer-form");
    const inputEl = document.getElementById("answer-input");
    const submitBtn = document.getElementById("submit-answer");

    let answers = [];

    // Function to fetch the first question
    async function loadFirstQuestion() {
        try {
            const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-guided", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: "Start guided document flow" })
            });

            const data = await response.json();

            if (response.ok && data.question) {
                statusEl.innerText = data.question;
            } else {
                statusEl.innerText = "❌ Failed to load first question.";
                console.error("API error:", data);
            }
        } catch (error) {
            statusEl.innerText = "❌ Error connecting to Veritas AI server.";
            console.error("Connection error:", error);
        }
    }

    // Submit answer to backend
    formEl.addEventListener("submit", async function (e) {
        e.preventDefault();
        const answer = inputEl.value.trim();

        if (!answer) return;

        // Add current answer to answers array
        answers.push(answer);

        // Clear input
        inputEl.value = "";
        submitBtn.disabled = true;
        statusEl.innerText = "⏳ Processing...";

        try {
            const response = await fetch("https://AiLawSolutions.pythonanywhere.com/submit-guided", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.next_question) {
                    // Next question in the flow
                    statusEl.innerText = data.next_question;
                    submitBtn.disabled = false;
                } else if (data.document_url) {
                    // Flow is done — provide document
                    statusEl.innerHTML = `
                        ✅ Document ready:<br>
                        <a href="${data.document_url}" target="_blank">Download Document</a>
                    `;
                    formEl.style.display = "none";
                } else {
                    statusEl.innerText = "❌ Unexpected response from server.";
                    console.error("Unexpected API response:", data);
                }
            } else {
                statusEl.innerText = "❌ Failed to submit answer.";
                console.error("API error:", data);
                submitBtn.disabled = false;
            }
        } catch (error) {
            statusEl.innerText = "❌ Error submitting answer.";
            console.error("Connection error:", error);
            submitBtn.disabled = false;
        }
    });

    // Kick off the flow
    loadFirstQuestion();
});
