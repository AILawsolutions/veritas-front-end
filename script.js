const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');

// Simulate sending message
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user-message');
    chatInput.value = '';

    // Simulate AI thinking and response
    thinkingBar.style.display = 'block';
    setTimeout(() => {
        thinkingBar.style.display = 'none';
        addMessage(`Lexorva response to: "${text}"`, 'ai-message');
        // If user says "draft" → show PDF preview example
        if (text.toLowerCase().includes('draft')) {
            addPdfPreview();
        }
    }, 2000);
}

function addMessage(text, className) {
    const msg = document.createElement('div');
    msg.className = `message ${className}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addPdfPreview() {
    const msg = document.createElement('div');
    msg.className = 'message ai-message';
    msg.innerHTML = `
        <strong>[PDF]</strong> Motion_to_Dismiss_Ohio.pdf<br/>
        <button onclick="alert('View PDF')">View</button>
        <button onclick="alert('Edit PDF')">Edit</button>
        <button onclick="alert('Download PDF')">Download</button>
    `;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
