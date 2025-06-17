document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");
    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;
    let uploadedFileName = "";

    // Upload file bubble
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;
        uploadedFile = file;
        uploadedFileName = file.name;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 <strong>Uploaded:</strong> ${file.name}`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    // Send on Enter key
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const prompt = chatInput.value.trim();
        if (!prompt && !uploadedFile) return;

        appendMessage("user", prompt || `📄 Uploaded file: ${uploadedFileName}`);
        chatInput.value = "";

        const thinkingDiv = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", prompt);

                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });

                // Don't clear file memory so it can be referenced again
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt })
                });
            }

            const data = await response.json();
            const responseText = data.result || data.response || data.choices?.[0]?.message?.content || "⚠️ Lexorva could not generate a response.";

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
        } catch (err) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "⚠️ Error: Lexorva could not complete your request.");
        }
    });

    // Append message
    function appendMessage(sender, text) {
        const div = document.createElement("div");
        div.className = sender === "user" ? "user-message" : "ai-message";
        div.innerHTML = text;
        chatHistory.appendChild(div);
        smoothScrollToBottom();
        return div;
    }

    function typeMessage(element, html, cb) {
        element.innerHTML = "";
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || "";
        let index = 0;

        function type() {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                smoothScrollToBottom();
                setTimeout(type, 10);
            } else {
                element.innerHTML = html;
                smoothScrollToBottom();
                if (cb) cb();
            }
        }
        type();
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

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }
});
