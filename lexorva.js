// lexorva.js – ChatGPT-style file + message

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Handle file upload preview (no send yet)
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        // Show preview bubble
        let preview = document.getElementById("fileBubble");
        if (preview) preview.remove();

        preview = document.createElement("div");
        preview.id = "fileBubble";
        preview.className = "user-message";
        preview.style.marginBottom = "8px";
        preview.innerHTML = `📄 <strong>${file.name}</strong>
            <button style="margin-left:10px; background:none; border:none; color:#fff; cursor:pointer;" onclick="removeFile()">❌</button>`;

        chatHistory.appendChild(preview);
        smoothScrollToBottom();
    });

    window.removeFile = () => {
        uploadedFile = null;
        const preview = document.getElementById("fileBubble");
        if (preview) preview.remove();
        fileUploadInput.value = "";
    };

    // Enter sends message
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (uploadedFile) {
            appendMessage("user", `📄 <strong>${uploadedFile.name}</strong>`);
        }
        if (message) {
            appendMessage("user", message);
        }

        chatInput.value = "";
        const fileBubble = document.getElementById("fileBubble");
        if (fileBubble) fileBubble.remove();

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message);
                uploadedFile = null;

                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });
            }

            const data = await response.json();
            let responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "⚠️ Unexpected response.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "❌ Error: Failed to reach Lexorva.");
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
