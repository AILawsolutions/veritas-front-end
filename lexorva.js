let uploadedText = "";
let uploadedFileName = "";
let typingTimeout;

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const fileUpload = document.getElementById("fileUpload");
const downloadButton = document.getElementById("downloadButton");

// Add message to chat
function addMessage(message, sender) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}-bubble`;
    bubble.innerText = message;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Simulate typewriter AI effect
function typewriterEffect(text, callback) {
    const bubble = document.createElement("div");
    bubble.className = "bubble ai-bubble";
    chatContainer.appendChild(bubble);
    let i = 0;
    typingTimeout = setInterval(() => {
        if (i < text.length) {
            bubble.innerText += text.charAt(i++);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            clearInterval(typingTimeout);
            callback && callback();
        }
    }, 20);
}

// Send user question
async function sendMessage() {
    const question = userInput.value.trim();
    if (!question) return;

    addMessage(question, "user");
    userInput.value = "";

    const prompt = uploadedText
        ? `The user uploaded the following legal document:\n\n"${uploadedText}"\n\nNow, here is their question:\n\n"${question}"`
        : question;

    try {
        const response = await fetch("http://127.0.0.1:5000/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        const aiMessage = data.choices?.[0]?.message?.content || "Error: No response.";
        typewriterEffect(aiMessage, () => {
            if (aiMessage.toLowerCase().includes("strategy report")) {
                downloadButton.style.display = "block";
            }
        });
    } catch (err) {
        addMessage("Error contacting Lexorva server.", "ai");
    }
}

// Upload and parse file
fileUpload.addEventListener("change", async () => {
    const file = fileUpload.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    uploadedFileName = file.name;

    const previewBubble = document.createElement("div");
    previewBubble.className = "bubble user-bubble";
    previewBubble.innerText = `📎 Uploaded: ${uploadedFileName}`;
    chatContainer.appendChild(previewBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        uploadedText = data.result || "";

        const confirm = document.createElement("div");
        confirm.className = "bubble ai-bubble";
        confirm.innerText = "✅ Document successfully uploaded and analyzed. Ask any questions now.";
        chatContainer.appendChild(confirm);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } catch (err) {
        addMessage("Error uploading file.", "ai");
    }
});

// Enable enter key to send
userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener("click", sendMessage);

// Download report
downloadButton.addEventListener("click", () => {
    const lastBubble = [...document.querySelectorAll(".ai-bubble")].pop();
    const content = lastBubble ? lastBubble.innerText : "";
    const blob = new Blob([content], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Lexorva_Strategy_Report.pdf";
    link.click();
});
