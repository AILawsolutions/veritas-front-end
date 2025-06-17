let uploadedText = ""; // Memory of uploaded file content
let isTyping = false;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const fileUpload = document.getElementById("fileUpload");

// Display message bubble
function addMessage(message, sender) {
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "bubble user-bubble" : "bubble ai-bubble";
    bubble.innerText = message;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle sending prompt
async function sendPrompt() {
    const prompt = userInput.value.trim();
    if (!prompt || isTyping) return;

    addMessage(prompt, "user");
    userInput.value = "";
    isTyping = true;

    try {
        const res = await fetch("http://localhost:5000/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: uploadedText + "\n\n" + prompt })
        });

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || "⚠️ Error: No response from Lexorva.";
        addMessage(reply, "ai");
    } catch (err) {
        addMessage("❌ Failed to connect to server.", "ai");
    } finally {
        isTyping = false;
    }
}

// Handle PDF upload
fileUpload.addEventListener("change", async () => {
    const file = fileUpload.files[0];
    if (!file) return;

    addMessage(`📎 Uploaded: ${file.name}`, "user");

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data?.result) {
            uploadedText = data.result;
            addMessage("✅ Document successfully registered. Ask Lexorva anything about it.", "ai");
        } else {
            addMessage("❌ Could not extract text from document.", "ai");
        }
    } catch (err) {
        addMessage("❌ Upload failed.", "ai");
    }
});

// Submit button + Enter key
sendButton.onclick = sendPrompt;
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
    }
});
