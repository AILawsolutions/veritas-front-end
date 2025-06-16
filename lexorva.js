const CHAT_ENDPOINT = "https://YOUR_USERNAME.pythonanywhere.com/proxy";
const UPLOAD_ENDPOINT = "https://YOUR_USERNAME.pythonanywhere.com/upload";

const fileInput = document.getElementById("fileUpload");
const messageInput = document.getElementById("messageInput");
const chatBox = document.getElementById("chatBox");
const sendButton = document.getElementById("sendButton");

function appendMessage(role, content) {
  const message = document.createElement("div");
  message.className = role;
  message.textContent = content;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const prompt = messageInput.value.trim();
  if (!prompt) return;

  appendMessage("user", prompt);
  messageInput.value = "";

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (data.choices && data.choices[0].message.content) {
      appendMessage("ai", data.choices[0].message.content);
    } else {
      appendMessage("ai", "⚠️ Error: No response from Lexorva.");
    }
  } catch (err) {
    appendMessage("ai", "⚠️ Error: Failed to communicate with Lexorva.");
  }
}

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return;

  appendMessage("user", `📄 Uploaded file: ${file.name}`);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.result) {
      appendMessage("ai", data.result);
    } else {
      appendMessage("ai", "⚠️ Error: Could not process the file.");
    }
  } catch (err) {
    appendMessage("ai", "⚠️ Error: Failed to communicate with Lexorva.");
  }
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
fileInput.addEventListener("change", uploadFile);
