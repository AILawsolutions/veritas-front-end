document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;
    let documentUploaded = false;

    // Download button
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "⬇️ Download Strategy Report";
    downloadButton.style = `
        display: none;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        color: white;
        padding: 8px 16px;
        margin: 12px 0 4px 0;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
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

    // File upload preview
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;
        documentUploaded = true;

        const bubble = document.createElement("div");
        bubble.classList.add("user-message");
        bubble.style.marginBottom = "6px";
        bubble.innerHTML = `📄 <strong>Uploaded:</strong> ${file.name}`;
        chatHistory.appendChild(bubble);
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

        appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
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
            const result = data.result || data.response || (data.choices?.[0]?.message?.content) || "⚠️ Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(result), () => {
                if (result.toLowerCase().includes("strategy report")) {
                    downloadButton.style.display = "inline-block";
                }
            });
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "⚠️ Error: Lexorva failed to respond.");
        }
    });

    function appendMessage(sender, text) {
        const bubble = document.createElement("div");
        bubble.classList.add(sender === "user" ? "user-message" : "ai-message");
        bubble.innerHTML = text;
        chatHistory.appendChild(bubble);
        smoothScrollToBottom();
        return bubble;
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

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }
});
