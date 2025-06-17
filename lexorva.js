let uploadedText = null;
const fileUploadInput = document.getElementById('fileUpload');
const responseBox = document.getElementById('responseBox');
const userInput = document.getElementById('userInput');
const submitButton = document.getElementById('submitButton');
const chatContainer = document.getElementById('chatContainer');
const downloadBtn = document.getElementById('downloadBtn');

// Handle Enter key to trigger sendMessage
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Handle file upload and send to /upload
fileUploadInput.addEventListener('change', async () => {
    const file = fileUploadInput.files[0];
    if (!file) return;

    appendMessage('user', `📄 Uploaded: ${file.name}`);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (data.result) {
            uploadedText = data.result;
            appendMessage('lexorva', 'Document received. You may now ask questions about it.');
        } else {
            appendMessage('lexorva', 'Error processing the file.');
        }
    } catch (error) {
        appendMessage('lexorva', 'Failed to upload file.');
    }
});

// Send question to /proxy
async function sendMessage() {
    const prompt = userInput.value.trim();
    if (!prompt) return;

    appendMessage('user', prompt);
    userInput.value = '';

    const fullPrompt = uploadedText ? `${uploadedText}

${prompt}` : prompt;

    try {
        const response = await fetch('/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt }),
        });

        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
            const reply = data.choices[0].message.content;
            appendMessage('lexorva', reply);

            // Show download button only if "Strategy Report" is mentioned
            if (reply.toLowerCase().includes('strategy report')) {
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = () => downloadReport(reply);
            } else {
                downloadBtn.style.display = 'none';
            }
        } else {
            appendMessage('lexorva', 'Unexpected response from Lexorva.');
        }
    } catch (error) {
        appendMessage('lexorva', 'Failed to get response.');
    }
}

// Append chat messages
function appendMessage(sender, message) {
    const messageEl = document.createElement('div');
    messageEl.className = sender === 'user' ? 'chat-bubble user-bubble' : 'chat-bubble ai-bubble';
    messageEl.textContent = message;
    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Download strategy report as .txt
function downloadReport(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'Lexorva_Strategy_Report.txt';
    link.href = window.URL.createObjectURL(blob);
    link.click();
}
