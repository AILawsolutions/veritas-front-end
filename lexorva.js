document.addEventListener("DOMContentLoaded", function () {
  const chatContainer = document.getElementById("chatContainer");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const fileInput = document.getElementById("fileInput");

  let uploadedFile = null;
  let uploadedText = null;

  // Fix: send message on Enter
  userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // Fix: send button click handler
  sendButton.addEventListener("click", async function () {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("user", message);
    userInput.value = "";

    appendThinking();

    const payload = {
      prompt: message,
      file_text: uploadedText || null,
    };

    try {
      const response = await fetch("/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      removeThinking();

      if (data.reply) {
        appendMessage("ai", data.reply);
        showDownloadButton(data.reply);
      } else {
        appendMessage("ai", "⚠️ No response from Lexorva.");
      }
    } catch (err) {
      removeThinking();
      appendMessage("ai", `⚠️ Error: ${err.message}`);
    }
  });

  fileInput.addEventListener("change", async function () {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    appendMessage("user", `📎 ${file.name} uploaded. Ask your question below.`);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      uploadedFile = file.name;
      uploadedText = result.file_text;
    } catch (err) {
      appendMessage("ai", `⚠️ File upload failed: ${err.message}`);
    }
  });

  function appendMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = sender === "user" ? "user-message" : "ai-message";
    chatContainer.appendChild(messageDiv);

    if (sender === "ai") {
      typewriterEffect(messageDiv, text, 10);
    } else {
      messageDiv.textContent = text;
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function appendThinking() {
    const thinking = document.createElement("div");
    thinking.className = "ai-message";
    thinking.id = "thinkingBubble";
    thinking.textContent = "Lexorva is thinking...";
    chatContainer.appendChild(thinking);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function removeThinking() {
    const thinking = document.getElementById("thinkingBubble");
    if (thinking) thinking.remove();
  }

  function showDownloadButton(content) {
    const btn = document.createElement("button");
    btn.textContent = "Download Strategy Report";
    btn.className = "download-btn";
    btn.onclick = () => downloadPDF(content);
    chatContainer.appendChild(btn);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function downloadPDF(content) {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 20);
    doc.save("Lexorva-Strategy-Report.pdf");
  }

  function typewriterEffect(element, text, speed) {
    let i = 0;
    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(interval);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, speed);
  }
});
