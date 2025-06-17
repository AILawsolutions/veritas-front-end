document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // File upload bubble display
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        scrollToBottom();
    });

    // Handle Enter key
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

        const thinkingDiv = appendMessage("ai", "Thinking...");
        if (uploadedFile) {
            const formData = new FormData();
            formData.append("file", uploadedFile);
            formData.append("prompt", message);

            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            const result = data.result || "Error: Unexpected response from Lexorva.";
            thinkingDiv.innerHTML = marked.parse(result);
            uploadedFile = null;
        } else {
            const response = await fetch(`${BACKEND_URL}/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: message })
            });

            const data = await response.json();
            const result = data.choices?.[0]?.message?.content || "Error: Unexpected response from Lexorva.";
            thinkingDiv.innerHTML = marked.parse(result);
        }

        addDownloadButton(thinkingDiv);
        scrollToBottom();
    });

    function appendMessage(role, content) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(role === "user" ? "user-message" : "ai-message");
        messageDiv.innerHTML = content;
        chatHistory.appendChild(messageDiv);
        return messageDiv;
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addDownloadButton(afterElement) {
        const button = document.createElement("button");
        button.textContent = "⬇ Download Strategy Report";
        button.style.cssText = `
            display: block;
            margin: 10px 0 0;
            padding: 6px 12px;
            font-size: 14px;
            border: none;
            border-radius: 6px;
            background-color: rgba(168, 77, 242, 0.1);
            color: #A84DF2;
            font-family: 'Rajdhani', sans-serif;
            cursor: pointer;
        `;
        button.onclick = () => {
            const blob = new Blob([afterElement.innerText], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Lexorva_Strategy_Report.pdf";
            a.click();
            URL.revokeObjectURL(url);
        };
        afterElement.insertAdjacentElement("afterend", button);
    }
});
