// lexorva.js

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");

    const fileUploadInput = document.getElementById("fileUpload");

    // Update this to your backend URL:
    const BACKEND_URL = "https://AiLawSolutions.pythonanywhere.com";

    // Allow pressing Enter to send message
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send plain chat message to /proxy
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (message === "") return;

        appendMessage("user", message);
        chatInput.value = "";

        // Add "Thinking..." message in chat
        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            const response = await fetch(`${BACKEND_URL}/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: message })
            });

            const data = await response.json();

            let responseText = "";

            if (data.choices && data.choices[0]?.message?.content) {
                responseText = data.choices[0].message.content;
            } else if (data.response) {
                responseText = data.response;
            } else {
                responseText = "Error: Unexpected response from Lexorva.";
            }

            // Stop thinking dots and start typing response
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));

        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }
    });

    // File upload for /analyze-upload
    fileUploadInput.addEventListener("change", async () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        appendMessage("user", `ð Uploaded file: ${file.name}`);

        // Add "Thinking..." message in chat
        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${BACKEND_URL}/analyze-upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            let responseText = "";

            if (data.choices && data.choices[0]?.message?.content) {
                responseText = data.choices[0].message.content;
            } else if (data.response) {
                responseText = data.response;
            } else {
                responseText = "Error: Unexpected response from Lexorva.";
            }

            // Stop thinking dots and start typing response
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));

        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }
    });

    // Helper to append message to chat
    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");

        const className = sender === "user" ? "user-message" : "ai-message";
        messageDiv.classList.add(className);

        messageDiv.innerHTML = text;

        chatHistory.appendChild(messageDiv);
        smoothScrollToBottom();

        return messageDiv;
    }

    // Helper to smoothly scroll to latest message
    function smoothScrollToBottom() {
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior: "smooth"
        });
    }

    // Typing animation
    function typeMessage(element, htmlContent) {
        element.innerHTML = ""; // Clear "Thinking..."

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";

        let index = 0;

        function typeChar() {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                smoothScrollToBottom();
                setTimeout(typeChar, 15); // Typing speed (ms)
            } else {
                // When finished, display full HTML (parsed Markdown)
                element.innerHTML = htmlContent;
                smoothScrollToBottom();
            }
        }

        typeChar();
    }

    // Thinking dots animation
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
        element.innerHTML = ""; // Will be replaced by typeMessage
    }
});
