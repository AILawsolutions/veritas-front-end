// lexorva.js

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const thinkingIndicator = document.getElementById("thinking");

    const fileUploadInput = document.getElementById("fileUpload");
    const downloadPdfLink = document.getElementById("downloadPdf");

    // Update this to your backend URL:
    const BACKEND_URL = "https://AiLawSolutions.pythonanywhere.com";

    // Allow pressing Enter to send message
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send plain chat message to /proxy
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (message === "") return;

        appendMessage("user", message);
        chatInput.value = "";
        showThinking(true);

        try {
            const response = await fetch(`${BACKEND_URL}/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: message })
            });

            const data = await response.json();

            if (data.choices && data.choices[0]?.message?.content) {
                appendMessage("lexorva", data.choices[0].message.content);
            } else {
                appendMessage("lexorva", "Error: Unexpected response from Lexorva.");
            }
        } catch (error) {
            appendMessage("lexorva", "Error: Failed to communicate with Lexorva.");
        } finally {
            showThinking(false);
        }
    });

    // File upload for /analyze-upload
    fileUploadInput.addEventListener("change", async () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        appendMessage("user", `📄 Uploaded file: ${file.name}`);
        showThinking(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${BACKEND_URL}/analyze-upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.choices && data.choices[0]?.message?.content) {
                appendMessage("lexorva", data.choices[0].message.content);
            } else {
                appendMessage("lexorva", "Error: Unexpected response from Lexorva.");
            }
        } catch (error) {
            appendMessage("lexorva", "Error: Failed to communicate with Lexorva.");
        } finally {
            showThinking(false);
        }
    });

    // Download PDF from Drafting Guide
    downloadPdfLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const answers = [
            document.getElementById("q1").value.trim(),
            document.getElementById("q2").value.trim(),
            document.getElementById("q3").value.trim(),
            document.getElementById("q4").value.trim(),
            document.getElementById("q5").value.trim(),
            document.getElementById("q6").value.trim(),
            document.getElementById("q7").value.trim(),
            document.getElementById("q8").value.trim(),
            document.getElementById("q9").value.trim()
        ];

        showThinking(true);

        try {
            const htmlResponse = await fetch(`${BACKEND_URL}/render-html`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers })
            });

            const htmlData = await htmlResponse.json();

            if (htmlData.error) {
                appendMessage("lexorva", `Error: ${htmlData.error}`);
                showThinking(false);
                return;
            }

            const pdfResponse = await fetch(`${BACKEND_URL}/generate-pdf-from-html`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html: htmlData.html })
            });

            const pdfBlob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(pdfBlob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "court_document.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            appendMessage("lexorva", "✅ PDF downloaded successfully.");
        } catch (error) {
            appendMessage("lexorva", "Error: Failed to generate PDF.");
        } finally {
            showThinking(false);
        }
    });

    // Helper to append message to chat
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");

        // Map "user" → "user-message", "lexorva" → "ai-message"
        const className = sender === "user" ? "user-message" : "ai-message";

        messageDiv.classList.add(className);
        messageDiv.innerHTML = text;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Helper to show/hide "Thinking..."
    function showThinking(show) {
        thinkingIndicator.style.display = show ? "block" : "none";
    }
});
