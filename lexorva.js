document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;

    // Create download button (hidden by default)
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "⬇️ Download Strategy Report";
    downloadButton.style = `
        display: none;
        background: transparent;
        border: 1px solid #C168F9;
        color: #C168F9;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 14px;
        font-family: 'Rajdhani', sans-serif;
        cursor: pointer;
        margin-top: 12px;
    `;
    chatHistory.appendChild(downloadButton);

    downloadButton.addEventListener("click", () => {
        const lastAI = [...chatHistory.getElementsByClassName("ai-message")].pop();
        if (!lastAI) return;
        const blob = new Blob([lastAI.innerText], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Lexorva_Strategy_Report.pdf";
        a.click();
        URL.revokeObjectURL(url);
    });

    // Handle file preview
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

    // Handle enter key
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // Handle message send
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
                    body: formData,
                });
                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message }),
                });
            }

            const data = await response.json();
            const reply = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: No response from Lexorva.";
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(reply), () => {
                if (reply.toLowerCase().includes("strategy report")) {
                    downloadButton.style.display = "inline-block";
                } else {
                    downloadButton.style.display = "none";
                }
            });
        } catch (err) {
            stopThinkingDots(thinkingDiv);
            thinkingDiv.innerHTML = "Error: Failed to contact Lexorva.";
        }
    });

    function appendMessage(sender, html) {
        const div = document.createElement("div");
        div.className = sender === "user" ? "user-message" : "ai-message";
        div.innerHTML = html;
        chatHistory.appendChild(div);
        smoothScrollToBottom();
        return div;
    }

    function typeMessage(div, fullHTML, callback) {
        div.innerHTML = "";
        const temp = document.createElement("div");
        temp.innerHTML = fullHTML;
        const text = temp.textContent || temp.innerText || "";
        let idx = 0;

        function type() {
            if (idx < text.length) {
                div.innerHTML += text.charAt(idx);
                idx++;
                smoothScrollToBottom();
                setTimeout(type, 10);
            } else {
                div.innerHTML = fullHTML;
                smoothScrollToBottom();
                if (callback) callback();
            }
        }
        type();
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    let dots;
    function startThinkingDots(div) {
        downloadButton.style.display = "none";
        let count = 0;
        dots = setInterval(() => {
            div.innerHTML = "Thinking" + ".".repeat(count++ % 4);
        }, 500);
    }

    function stopThinkingDots(div) {
        clearInterval(dots);
        div.innerHTML = "";
    }
});
