document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Submit on Enter
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    // File upload preview
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;
        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.className = "user-message";
        fileBubble.innerHTML = `📄 <strong>Uploaded:</strong> ${file.name}`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    sendButton.addEventListener("click", async () => {
        const prompt = chatInput.value.trim();
        if (!prompt && !uploadedFile) return;

        if (prompt) appendMessage("user", prompt);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai-message", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
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
                    body: JSON.stringify({ prompt })
                });
            }

            const data = await response.json();
            const output = data.result || data.choices?.[0]?.message?.content || "⚠️ Error: No response received.";
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(output), output);
        } catch (err) {
            stopThinkingDots(thinkingDiv);
            thinkingDiv.innerHTML = "⚠️ Lexorva failed to respond.";
        }
    });

    function appendMessage(type, text) {
        const div = document.createElement("div");
        div.className = type;
        div.innerHTML = text;
        chatHistory.appendChild(div);
        smoothScrollToBottom();
        return div;
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    function typeMessage(container, html, rawText) {
        container.innerHTML = "";
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || "";
        let i = 0;

        function typeChar() {
            if (i < text.length) {
                container.innerHTML += text.charAt(i);
                i++;
                smoothScrollToBottom();
                setTimeout(typeChar, 10);
            } else {
                container.innerHTML = html;
                smoothScrollToBottom();

                // 🔽 Show download only for strategy reports
                if (rawText.toLowerCase().includes("strategy report") || rawText.toLowerCase().includes("legal strategy")) {
                    const btn = document.createElement("button");
                    btn.textContent = "⬇️ Download Strategy Report";
                    btn.style = `
                        margin-top: 12px;
                        background: rgba(255,255,255,0.05);
                        color: #ccc;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 8px;
                        padding: 6px 14px;
                        font-family: Rajdhani, sans-serif;
                        font-size: 14px;
                        cursor: pointer;
                    `;
                    btn.onclick = () => downloadPDF(rawText);
                    chatHistory.appendChild(btn);
                    smoothScrollToBottom();
                }
            }
        }
        typeChar();
    }

    function downloadPDF(content) {
        const blob = new Blob([content], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Lexorva_Strategy_Report.pdf";
        a.click();
        URL.revokeObjectURL(url);
    }

    let thinkingInterval;
    function startThinkingDots(div) {
        let dots = 0;
        thinkingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            div.innerHTML = "Thinking" + ".".repeat(dots);
        }, 400);
    }

    function stopThinkingDots(div) {
        clearInterval(thinkingInterval);
        div.innerHTML = "";
    }
});
