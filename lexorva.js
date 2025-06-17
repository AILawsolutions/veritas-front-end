let uploadedText = ""; // Stores the extracted text from the uploaded PDF
let isTyping = false;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const fileUpload = document.getElementById("fileUpload");

// Add a message bubble
function addMessage(message, sender) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.classList.add(sender === "user" ? "user-bubble" : "ai-bubble");
    bubble.innerText = message;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle PDF upload and send to backend
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
            addMessage("✅ Document registered. Ask any questions about it.", "ai");
        } else if (data.error) {
            addMessage("❌ Error: " + data.error, "ai");
        } else {
            addMessage("❌ Unexpected error processing document.", "ai");
        }
    } catch (error) {
        addMessage("❌ Upload failed. Please try again.", "ai");
    }
});

// Handle user prompt
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

        if (data.choices && data.choices[0].message.content) {
            addMessage(data.choices[0].message.content, "ai");
        } else {
            addMessage("❌ No response from Lexorva.", "ai");
        }
    } catch (error) {
        addMessage("❌ Failed to connect to Lexorva.", "ai");
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
