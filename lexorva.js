let uploadedFile = null;
let fileName = '';
let fileData = null;

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const fileUpload = document.getElementById('file-upload');

sendButton.addEventListener('click', async () => {
    const userMessage = userInput.value.trim();
    if (userMessage === '' && !uploadedFile) return;

    appendMessage('You', userMessage, 'user');
    userInput.value = '';

    if (uploadedFile && !fileData) {
        const reader = new FileReader();
        reader.onload = async () => {
            fileData = reader.result.split(',')[1];
            await sendToServer(userMessage);
        };
        reader.readAsDataURL(uploadedFile);
    } else {
        await sendToServer(userMessage);
    }
});

fileUpload.addEventListener('change', (event) => {
    uploadedFile = event.target.files[0];
    fileName = uploadedFile.name;
    appendMessage('You uploaded', fileName, 'user');
});

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click();
    }
});

function appendMessage(sender, message, type = 'bot') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendTypingEffect(text) {
    return new Promise((resolve) => {
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        chatContainer.appendChild(botMessage);

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                botMessage.textContent += text.charAt(i);
                i++;
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                clearInterval(interval);
                addDownloadButton(text, botMessage);
                resolve();
            }
        }, 20);
    });
}

function addDownloadButton(content, referenceNode) {
    const button = document.createElement('button');
    button.textContent = 'Download PDF';
    button.style.marginTop = '10px';
    button.style.background = 'rgba(255,255,255,0.05)';
    button.style.border = '1px solid rgba(255,255,255,0.1)';
    button.style.padding = '6px 12px';
    button.style.borderRadius = '6px';
    button.style.fontSize = '14px';
    button.style.color = '#fff';
    button.style.cursor = 'pointer';
    button.style.transition = 'opacity 0.3s ease';
    button.onmouseover = () => button.style.opacity = '0.8';
    button.onmouseout = () => button.style.opacity = '1';

    button.addEventListener('click', () => {
        const blob = new Blob([content], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Lexorva_Strategy_Report.pdf';
        link.click();
    });

    referenceNode.appendChild(button);
}

async function sendToServer(prompt) {
    try {
        const response = await fetch('/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                filename: fileName || null,
                filedata: fileData || null
            })
        });

        const data = await response.json();
        const botMessage = data.response || 'Sorry, no response received.';
        await appendTypingEffect(botMessage);
    } catch (error) {
        console.error('Error:', error);
        appendMessage('Lexorva', 'An error occurred while processing your request.', 'bot');
    }
}
