document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null; // Will store file across multiple questions
    let extractedText = "";  // Store extracted OCR/text for persistent use

    // Show file bubble when uploaded
    fileUploadInput.addEventListener("change", async () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();

        // Send file to backend once, store extractedText
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("prompt", "Extract and save the content for session use.");

        try {
            const res = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            extractedText = data.result || "";
        } catch (e) {
            appendMessage("ai", "❌ Error: Failed to extract document content.");
        }
    });

    // Press Enter to send
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send Button logic
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile && !extractedText) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            let responseText;

            if (uploadedFile && extractedText) {
                // Session-persistent document memory
                const fullPrompt = `${extractedText}\n\n${message}`;
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: fullPrompt })
                });

            } else {
                // No file uploaded, just question
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });
            }

            const data = await response.json();
            responseText = data.result || data.response || data.choices?.[0]?.message?.content || "⚠️ Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));

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
});
