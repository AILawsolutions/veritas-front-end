// ✅ FINAL Lexorva.js with Persistent File Memory + Faster Typewriter Speed

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;
    let storedFile = null;

    // Show file bubble when uploaded
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;
        storedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    // Press Enter to send
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile && !storedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            let responseText;

            if (uploadedFile || storedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile || storedFile);
                formData.append("prompt", message);

                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                responseText = data.result || "Document received. You may now ask questions about it.";

                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });

                const data = await response.json();
                responseText = data.result || data.response || (data.choices?.[0]?.message?.content) || "⚠️ Unexpected response from Lexorva.";
            }

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
            showDownloadButton(responseText);

        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "❌ Error: Could not connect to Lexorva backend.");
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
                setTimeout(typeChar, 1); // 🟢 MUCH FASTER — ChatGPT speed
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
        button.textContent = "⬇ Download Report";
        button.style.cssText = `
            display: block;
            margin: 12px auto 24px auto;
            padding: 6px 14px;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            cursor: pointer;
        `;
        button.onclick = () => {
            const blob = new Blob([textContent], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Lexorva_Strategy_Report_${new Date().toISOString().split("T")[0]}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        };
        chatHistory.appendChild(button);
        smoothScrollToBottom();
    }
});




// 📥 Download Report Button Logic
function addDownloadButtonIfEligible(responseText) {
    const responseLower = responseText.toLowerCase();
    const isMultiPart = responseText.length > 600 || responseLower.includes("strategy") || responseLower.includes("legal plan") || responseLower.includes("recommended actions");

    // Only trigger button if content qualifies
    if (!isMultiPart) return;

    // Remove existing button if any
    const existingButton = document.getElementById("downloadReportButton");
    if (existingButton) existingButton.remove();

    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadReportButton";
    downloadButton.textContent = "Download Report";
    downloadButton.style.cssText = `
        background-color: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        padding: 6px 14px;
        margin-top: 10px;
        margin-left: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-block;
    `;

    // Append to last AI message bubble
    const messageBubbles = document.querySelectorAll('.ai-response');
    const lastBubble = messageBubbles[messageBubbles.length - 1];
    if (lastBubble) lastBubble.appendChild(downloadButton);

    downloadButton.onclick = () => {
        const content = responseText;
        const doc = new window.jspdf.jsPDF();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Lexorva_Strategy_Report_${timestamp}.pdf`;

        const lines = doc.splitTextToSize(content, 180);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text(lines, 15, 20);
        doc.save(filename);
    };
}
