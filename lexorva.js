// lexorva.js (ChatGPT-style file upload)

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;

    // Handle file selection (like ChatGPT)
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        // Display file name above message input
        const existing = document.getElementById("filePreview");
        if (existing) existing.remove();

        const fileTag = document.createElement("div");
        fileTag.id = "filePreview";
        fileTag.style = "margin-bottom: 6px; color: #ffffff; background-color: #7b2cbf; padding: 8px 12px; border-radius: 10px; display: inline-block;";
        fileTag.innerHTML = `<strong>📄 ${file.name}</strong> <button style="margin-left: 10px; background:none; border:none; color:#fff; cursor:pointer;" onclick="removeFile()">❌</button>`;

        chatInput.parentNode.insertBefore(fileTag, chatInput);
    });

    window.removeFile = () => {
        uploadedFile = null;
        const fileTag = document.getElementById("filePreview");
        if (fileTag) fileTag.remove();
        fileUploadInput.value = "";
    };

    // Allow Enter to send
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send button logic
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (uploadedFile) {
            appendMessage("user", `📄 Uploaded file: ${uploadedFile.name}<br>${message || ""}`);
        } else {
            appendMessage("user", message);
        }

        chatInput.value = "";
        if (document.getElementById("filePreview")) {
            document.getElementById("filePreview").remove();
        }

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
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
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });
            }

            const data = await response.json();
            let responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: Unexpected response from Lexorva.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
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
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior: "smooth"
        });
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
