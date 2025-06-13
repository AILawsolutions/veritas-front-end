// lexorva.js

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const thinkingIndicator = document.getElementById("thinking");

    const fileUploadInput = document.getElementById("fileUpload");
    const saveChatPdfButton = document.getElementById("saveChatPdf");

    // Backend URL
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

    // Save Chat as PDF
    saveChatPdfButton.addEventListener("click", () => {
        const chatElement = document.getElementById("chatHistory");

        const opt = {
            margin: 0.5,
            filename: 'lexorva_chat.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(chatElement).save();
    });

    // Helper to append message to chat
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");

        // Map "user" → "user-message", "lexorva" → "ai-message"
        const className = sender === "user" ? "user-message" : "ai-message";

        messageDiv.classList.add(className);

        // If it's Lexorva, parse Markdown → HTML using marked
        if (sender === "lexorva") {
            messageDiv.innerHTML = marked.parse(text);
        } else {
            messageDiv.textContent = text;
        }

        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Helper to show/hide "Thinking..."
    function showThinking(show) {
        thinkingIndicator.style.display = show ? "block" : "none";
    }
});
