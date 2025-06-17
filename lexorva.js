let uploadedText = "";  // Holds uploaded file content
let isTyping = false;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const fileUpload = document.getElementById("fileUpload");

// Show user message
function addMessage(message, sender, isFinal = false) {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "bubble user-bubble" : "bubble ai-bubble";
    const text = document.createElement("div");
    text.className = "text";
    bubble.appendChild(text);
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    if (sender === "ai" && isFinal) {
        typeWriterEffect(message, text, () => showDownloadButton(message, bubble));
    } else {
        text.innerText = message;
    }
}

// Typewriter effect for AI
function typeWriterEffect(message, element, callback) {
    let i = 0;
    function type() {
        if (i < message.length) {
            element.innerHTML += message.charAt(i++);
            setTimeout(type, 10);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// Download button
function showDownloadButton(content, parent) {
    const btn = document.createElement("button");
    btn.innerText = "Download Strategy Report";
    btn.className = "download-button";
    btn.onclick = () => {
        const blob = new Blob([content], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Lexorva_Strategy_Report.pdf";
        link.click();
    };
    parent.appendChild(btn);
}

// Handle sending message
async function sendMessage() {
    if (isTyping) return;

    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    userInput.value = "";
    isTyping = true;

    try {
        const response = await fetch("http://localhost:5000/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: uploadedText + "\n\n" + message })
        });
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "⚠️ AI error.";
        addMessage(reply, "ai", true);
    } catch (err) {
        addMessage("⚠️ Failed to send request.", "ai");
    } finally {
        isTyping = false;
    }
}

// File upload handler
fileUpload.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    addMessage(`📎 ${file.name} uploaded. Analyzing now...`, "user");

    try {
        const res = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (data.result) {
            uploadedText = data.result;
            addMessage("✅ Document uploaded and registered. You may now ask questions.", "ai");
        } else {
            addMessage("❌ Could not read document.", "ai");
        }
    } catch {
        addMessage("❌ Upload failed. Try again.", "ai");
    }
});

// Button & Enter key
sendButton.onclick = sendMessage;
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
