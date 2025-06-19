let uploadedFileName = null;
let uploadedFileData = null;

// DOM elements
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const fileInput = document.getElementById('fileInput');

// Enable pressing Enter to send message
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener('click', sendMessage);

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  const fileBubble = document.createElement('div');
  fileBubble.className = 'user-message';
  fileBubble.innerHTML = `<strong>📎 ${file.name}</strong> ready for analysis. Ask your question below.`;
  chatContainer.appendChild(fileBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const result = await response.json();
    uploadedFileName = file.name;
    uploadedFileData = result.file_text;
  } catch (error) {
    alert('Error uploading file: ' + error.message);
  }
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendUserMessage(message);
  userInput.value = '';

  appendThinkingBubble();

  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
        file_text: uploadedFileData,
      }),
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    const aiReply = data.reply || '⚠️ No response received.';

    removeThinkingBubble();
    appendAIMessage(aiReply);
    showDownloadButton(aiReply);

  } catch (error) {
    removeThinkingBubble();
    appendAIMessage('⚠️ Error: ' + error.message);
  }
}

function appendUserMessage(message) {
  const msg = document.createElement('div');
  msg.className = 'user-message';
  msg.textContent = message;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendThinkingBubble() {
  const thinking = document.createElement('div');
  thinking.className = 'ai-message thinking';
  thinking.textContent = 'Lexorva is thinking...';
  thinking.id = 'thinkingBubble';
  chatContainer.appendChild(thinking);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeThinkingBubble() {
  const bubble = document.getElementById('thinkingBubble');
  if (bubble) bubble.remove();
}

function appendAIMessage(message) {
  const container = document.createElement('div');
  container.className = 'ai-message';

  const text = document.createElement('span');
  container.appendChild(text);
  chatContainer.appendChild(container);

  typewriterEffect(text, message, 10);
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

function showDownloadButton(content) {
  const button = document.createElement('button');
  button.textContent = 'Download Strategy Report';
  button.className = 'download-btn';
  button.addEventListener('click', () => downloadPDF(content));
  chatContainer.appendChild(button);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function downloadPDF(content) {
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(content, 180);
  doc.text(lines, 15, 20);
  doc.save('Lexorva-Strategy-Report.pdf');
}
