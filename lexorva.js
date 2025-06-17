document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Handle file selection
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

    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (message) {
            appendMessage("user", message);
        }

        chatInput.value = "";
        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;

            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message); // Send prompt alongside the file

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
            const responseText = data.result || data.choices?.[0]?.message?.content || "Error: Unexpected response.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "❌ Error: Something went wrong.");
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
