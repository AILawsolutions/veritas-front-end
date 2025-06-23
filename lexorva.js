// ✅ FINAL Lexorva.js with Download Report Button – Fully Integrated

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;
    let storedFile = null;

    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;
        storedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile && !storedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            let responseText;

            if (uploadedFile || storedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile || storedFile);
                formData.append("prompt", message);

                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                responseText = data.result || "Document received. You may now ask questions about it.";

                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });

                const data = await response.json();
                responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "⚠️ Unexpected response from Lexorva.";
            }

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
            showDownloadReportButton(responseText);

        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "❌ Error: Could not connect to Lexorva backend.");
        }
    });

    function appendMessage(sender, text) {
        const msg = document.createElement("div");
        msg.className = sender === "user" ? "user-message" : "ai-message";
        msg.innerHTML = text;
        chatHistory.appendChild(msg);
        smoothScrollToBottom();
        return msg;
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    function typeMessage(element, htmlContent) {
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
                setTimeout(typeChar, 1);
            } else {
                element.innerHTML = htmlContent;
                smoothScrollToBottom();
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

    function showDownloadReportButton(responseText) {
        if (responseText.length < 500) return; // Show only for detailed responses

        // Remove existing button if it exists
        const existing = document.getElementById("downloadReportButton");
        if (existing) existing.remove();

        const button = document.createElement("button");
        button.id = "downloadReportButton";
        button.textContent = "Download Report";
        button.style.cssText = `
            margin-top: 12px;
            margin-left: 0;
            background-color: rgba(255, 255, 255, 0.08);
            color: white;
            font-family: 'Orbitron', sans-serif;
            font-size: 13px;
            padding: 6px 14px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            cursor: pointer;
            display: inline-block;
        `;

        const lastAiBubble = document.querySelectorAll('.ai-message');
        if (lastAiBubble.length > 0) {
            lastAiBubble[lastAiBubble.length - 1].appendChild(button);
        }

        button.addEventListener("click", () => {
            const blob = new Blob([responseText], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            a.href = url;
            a.download = `Lexorva_Strategy_Report_${timestamp}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
});
