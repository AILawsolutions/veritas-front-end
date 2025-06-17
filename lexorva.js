document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;
    let uploadedText = "";

    // Create and style download button
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "⬇️ Download Strategy Report";
    downloadButton.style = `
        display: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        padding: 6px 12px;
        margin-top: 12px;
        cursor: pointer;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
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
        if (!message && !uploadedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai-message", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let responseText = "";

            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                responseText = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                }).then(res => res.json()).then(data => data.result || "Error: No response.");
                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                responseText = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                }).then(res => res.json()).then(data => {
                    return data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: Unexpected response.";
                });
            }

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText), () => {
                if (responseText.toLowerCase().includes("strategy report")) {
                    downloadButton.style.display = "inline-block";
                }
            });
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }
    });

    function appendMessage(className, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(className);
        messageDiv.innerHTML = text;
        chatHistory.appendChild(messageDiv);
        smoothScrollToBottom();
        return messageDiv;
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

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    let thinkingInterval;
});
