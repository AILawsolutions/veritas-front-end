// lexorva.js — ChatGPT-style file upload + message combo

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");
    let uploadedFile = null;

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send chat + file in same message (like ChatGPT)
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (message === "" && !uploadedFile) return;

        if (uploadedFile) {
            appendMessage("user", `<strong>📄 ${uploadedFile.name}</strong><br>${message}`);
        } else {
            appendMessage("user", message);
        }

        chatInput.value = "";

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            const formData = new FormData();
            if (uploadedFile) formData.append("file", uploadedFile);
            formData.append("prompt", message);

            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            let responseText = data?.result || data?.choices?.[0]?.message?.content || "Error: Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }

        uploadedFile = null;
        document.getElementById("filePreview").innerHTML = "";
    });

    // File upload preview (waits for user to click send)
    fileUploadInput.addEventListener("change", () => {
        uploadedFile = fileUploadInput.files[0];
        const preview = document.getElementById("filePreview");
        if (uploadedFile) {
            preview.innerHTML = `<div class="file-tag">📄 ${uploadedFile.name} <span class="file-remove" onclick="removeUpload()">✖</span></div>`;
        } else {
            preview.innerHTML = "";
        }
    });

    window.removeUpload = () => {
        uploadedFile = null;
        fileUploadInput.value = "";
        document.getElementById("filePreview").innerHTML = "";
    };

    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        const className = sender === "user" ? "user-message" : "ai-message";
        messageDiv.classList.add(className);
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
