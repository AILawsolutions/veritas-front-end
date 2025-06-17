let uploadedText = "";
let isTyping = false;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const fileUpload = document.getElementById("fileUpload");

// Add message bubble
function addMessage(message, sender) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender === "user" ? "user-bubble" : "ai-bubble"}`;
    bubble.innerText = message;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Upload document and extract text
fileUpload.addEventListener("change", async () => {
    const file = fileUpload.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    addMessage(`📎 Uploaded: ${file.name}`, "user");

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (data.result) {
            uploadedText = data.result;
            addMessage("✅ Document registered. Ask any questions about it below.", "ai");
        } else {
            addMessage("❌ Error: " + (data.error || "Unknown error."), "ai");
        }
    } catch (error) {
        addMessage("❌ Upload failed. Please check your server.", "ai");
    }
});

// Send prompt to Lexorva
async function sendPrompt() {
    const prompt = userInput.value.trim();
    if (!prompt || isTyping) return;

    addMessage(prompt, "user");
    userInput.value = "";
    isTyping = true;

    try {
        const response = await fetch("http://localhost:5000/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: uploadedText ? `${uploadedText}\n\n${prompt}` : prompt
            }),
        });

        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply) {
            addMessage(reply, "ai");
        } else {
            addMessage("❌ Lexorva did not return a response.", "ai");
        }
    } catch (error) {
        addMessage("❌ Request failed: " + error.message, "ai");
    } finally {
        isTyping = false;
    }
}

// Send on Enter key
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
    }
});

// Send on button click
sendButton.addEventListener("click", sendPrompt);
