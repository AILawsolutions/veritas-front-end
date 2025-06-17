document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Download button setup
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "⬇️ Download Strategy Report";
    downloadButton.style = `
        display: none;
        background: rgba(168, 77, 242, 0.1);
        color: #A84DF2;
        border: 1px solid #C168F9;
        border-radius: 12px;
        padding: 8px 14px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        margin-top: 10px;
        align-self: flex-start;
        cursor: pointer;
    `;
    chatHistory.appendChild(downloadButton);

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

    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;
        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.style.marginBottom = "4px";
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            let endpoint = uploadedFile ? "/upload" : "/proxy";
            let payload;

            if (uploadedFile && message) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message);
                payload = formData;
            } else {
                payload = JSON.stringify({ prompt: message });
            }

            response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: "POST",
                headers: uploadedFile ? undefined : { "Content-Type": "application/json" },
                body: payload
            });

            const data = await response.json();
            const reply = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(reply), () => {
                if (reply.toLowerCase().includes("strategy report")) {
                    downloadButton.style.display = "inline-block";
                }
            });
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
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
