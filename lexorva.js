document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;
    let lastResponseText = "";

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

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response, data;

            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message);

                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });

                data = await response.json();
                // Do NOT clear uploadedFile — keep it for session memory
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });

                data = await response.json();
            }

            const responseText = data.result || data.response || data.choices?.[0]?.message?.content || "⚠️ Unexpected response from Lexorva.";
            lastResponseText = responseText;

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
            showDownloadButton(responseText, thinkingDiv);

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
                setTimeout(typeChar, 15);
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

    function showDownloadButton(text, container) {
        const button = document.createElement("button");
        button.textContent = "Download PDF";
        button.style.cssText = `
            margin-top: 12px;
            padding: 6px 12px;
            background: rgba(255,255,255,0.08);
            color: white;
            font-size: 13px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
        `;

        button.onclick = () => {
            const doc = new window.jspdf.jsPDF();
            const lines = doc.splitTextToSize(text, 180);
            doc.text(lines, 15, 20);
            doc.save("Lexorva_Strategy_Report.pdf");
        };

        container.appendChild(button);
    }
});
