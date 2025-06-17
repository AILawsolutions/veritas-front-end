document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;
    let storedFileText = "";  // Stores parsed document text for session

    // Handle File Upload
    fileUploadInput.addEventListener("change", async () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        // Show file bubble
        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 <strong>Uploaded:</strong> ${file.name}`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();

        // Extract text via backend (but don’t respond yet)
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("prompt", "EXTRACT_ONLY");

        try {
            const res = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            storedFileText = data.result || "";
        } catch (err) {
            appendMessage("lexorva", "❌ Error reading the document. Please try again.");
        }

        uploadedFile = null;
        fileUploadInput.value = "";
    });

    // Send on Enter
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !storedFileText) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            const response = await fetch(`${BACKEND_URL}/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: storedFileText ? `Document: ${storedFileText}\n\nUser: ${message}` : message
                })
            });

            const data = await response.json();
            const responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: Unexpected response from Lexorva.";
            stopThinkingDots(thinkingDiv);

            // Render with markdown and add download if it's a report
            typeMessage(thinkingDiv, marked.parse(responseText), () => {
                if (responseText.includes("Strategy Report Builder") || responseText.includes("Downloadable Report")) {
                    createDownloadButton(thinkingDiv, responseText);
                }
            });

        } catch (err) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "❌ Error: Lexorva could not process your request.");
        }
    });

    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(sender === "user" ? "user-message" : "ai-message");
        messageDiv.innerHTML = text;
        chatHistory.appendChild(messageDiv);
        smoothScrollToBottom();
        return messageDiv;
    }

    function createDownloadButton(parent, content) {
        const button = document.createElement("button");
        button.textContent = "⬇️ Download Strategy Report";
        button.style = `
            background: linear-gradient(90deg, #A84DF2, #C168F9);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 8px 16px;
            margin-top: 12px;
            cursor: pointer;
            font-family: 'Rajdhani', sans-serif;
            font-size: 15px;
        `;
        button.addEventListener("click", () => {
            const blob = new Blob([content], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Lexorva_Strategy_Report.pdf";
            a.click();
            URL.revokeObjectURL(url);
        });
        parent.appendChild(button);
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    function typeMessage(element, htmlContent, callback) {
        element.innerHTML = "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        let index = 0;

        function typeChar() {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                smoothScrollToBottom();
                setTimeout(typeChar, 10);
            } else {
                element.innerHTML = htmlContent;
                smoothScrollToBottom();
                if (callback) callback();
            }
        }
        typeChar();
    }

    let thinkingInterval;
    function startThinkingDots(element) {
        let dotCount = 0;
        thinkingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            element.innerHTML = "Thinking" + ".".repeat(dotCount);
            smoothScrollToBottom();
        }, 500);
    }

    function stopThinkingDots(element) {
        clearInterval(thinkingInterval);
        element.innerHTML = "";
    }
});
