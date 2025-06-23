// ✅ LEXORVA.JS – FINAL FIXED VERSION (with Download Report button)
// Do NOT change any layout. This keeps everything identical but fixes the download feature.

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatHistory = document.getElementById("chat-history");

    let lastResponseContent = "";

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        appendMessage("user", userInput);
        chatInput.value = "";

        const aiMsg = appendMessage("ai", "");
        startThinkingDots(aiMsg);

        try {
            const response = await fetch("/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userInput })
            });

            const data = await response.json();
            stopThinkingDots(aiMsg);
            if (data && data.response) {
                typeMessage(aiMsg, data.response);
                lastResponseContent = data.response;

                if (
                    userInput.toLowerCase().includes("report") ||
                    userInput.toLowerCase().includes("strategy") ||
                    data.response.split(/\n|<br>/).length > 10
                ) {
                    showDownloadButton(data.response);
                }
            } else {
                aiMsg.innerHTML = "Sorry, I couldn’t generate a response.";
            }
        } catch (error) {
            stopThinkingDots(aiMsg);
            aiMsg.innerHTML = "Error: Could not connect to Lexorva backend.";
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
                setTimeout(typeChar, 5);
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

    function showDownloadButton(textContent) {
        const button = document.createElement("button");
        button.textContent = "⬇️ Download Report";
        button.style.cssText = `
            display: block;
            margin: 12px 0 24px 0;
            padding: 6px 12px;
            font-size: 14px;
            font-family: 'Rajdhani', sans-serif;
            background-color: rgba(255,255,255,0.05);
            color: white;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 6px;
            cursor: pointer;
            text-align: left;
        `;

        button.onclick = () => {
            const cleanedText = textContent.replace(/<[^>]+>/g, '');
            const blob = new Blob([cleanedText], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `Lexorva_Strategy_Report_${timestamp}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        };

        chatHistory.appendChild(button);
        smoothScrollToBottom();
    }
});
