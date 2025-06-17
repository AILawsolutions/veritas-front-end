document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Subtle download button, created once
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "Download Strategy Report";
    downloadButton.style = `
        display: none;
        background-color: transparent;
        color: #A84DF2;
        border: 1px solid #A84DF2;
        border-radius: 6px;
        font-size: 13px;
        padding: 4px 12px;
        font-family: 'Rajdhani', sans-serif;
        margin-top: 12px;
        align-self: flex-start;
        cursor: pointer;
    `;
    downloadButton.addEventListener("click", () => {
        const lastAIMessage = [...chatHistory.getElementsByClassName("ai-message")].pop();
        const blob = new Blob([lastAIMessage.innerText], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Lexorva_Strategy_Report.pdf";
        a.click();
        URL.revokeObjectURL(url);
    });

    // File bubble (ChatGPT-style)
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;
        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    // Fix Enter-to-Send
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai-message", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message);
                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });
                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });
            }

            const data = await response.json();
            const responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText), () => {
                // Only show the subtle download button if a strategy report was generated
                if (responseText.toLowerCase().includes("strategy report")) {
                    if (!chatHistory.contains(downloadButton)) {
                        chatHistory.appendChild(downloadButton);
                    }
                    downloadButton.style.display = "inline-block";
                } else {
                    downloadButton.style.display = "none";
                }
            });
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }
    });

    function appendMessage(type, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(type);
        messageDiv.innerHTML = text;
        chatHistory.appendChild(messageDiv);
        smoothScrollToBottom();
        return messageDiv;
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
        downloadButton.style.display = "none";
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
