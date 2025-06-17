let uploadedFileText = "";
let isTyping = false;

// DOM elements
const uploadInput = document.getElementById("fileUpload");
const chatContainer = document.getElementById("chatContainer");
const sendButton = document.getElementById("sendButton");
const userInput = document.getElementById("userInput");

// Handle file upload
uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    addMessage(`📎 ${file.name} uploaded. Analyzing now...`, "user");

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (data.result) {
            uploadedFileText = data.result;
            addMessage("✅ Document registered. You may now ask questions about it.", "ai");
        } else {
            addMessage("❌ Failed to read the document.", "ai");
        }
    } catch (err) {
        addMessage("⚠️ Error uploading file.", "ai");
    }
});

// Handle message sending
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    if (isTyping) return;

    const prompt = userInput.value.trim();
    if (!prompt) return;

    addMessage(prompt, "user");
    userInput.value = "";
    isTyping = true;

    try {
        const response = await fetch("http://localhost:5000/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: uploadedFileText + "\n\n" + prompt }),
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "⚠️ Error reading AI response.";

        addMessage(reply, "ai", true);
    } catch (err) {
        addMessage("⚠️ Request failed.", "ai");
    } finally {
        isTyping = false;
    }
}

// Add message bubble
function addMessage(content, sender, showDownload = false) {
    const message = document.createElement("div");
    message.className = sender === "user" ? "bubble user-bubble" : "bubble ai-bubble";

    const text = document.createElement("div");
    text.className = "text";
    message.appendChild(text);
    chatContainer.appendChild(message);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (sender === "ai" && showDownload) {
        typeWriterEffect(content, text, () => addDownloadButton(content, message));
    } else {
        text.innerText = content;
    }
}

// Typewriter effect for AI
function typeWriterEffect(text, element, callback) {
    let i = 0;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i++);
            setTimeout(type, 15);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// Add download button after AI response
function addDownloadButton(content, parent) {
    const button = document.createElement("button");
    button.innerText = "Download Strategy Report";
    button.className = "download-button";
    button.addEventListener("click", () => downloadPDF(content));
    parent.appendChild(button);
}

// Download PDF
function downloadPDF(text) {
    const blob = new Blob([text], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Lexorva_Strategy_Report.pdf";
    link.click();
}
