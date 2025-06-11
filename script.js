const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');
const fileUploadInput = document.getElementById('fileUpload');

let chatMessages = []; // Store chat memory

// Drafting flow state
let draftingFlowActive = false;
let draftingQuestions = [
    "Document Type",
    "State",
    "County",
    "Court Name",
    "Parties Involved",
    "Key Facts",
    "Legal Issues",
    "Conclusion / Relief Sought",
    "Attorney Signature Block or Additional Notes"
];
let draftingAnswers = [];
let currentDraftingIndex = 0;

// Event listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
fileUploadInput.addEventListener('change', handleFileUpload);

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user-message');
    chatInput.value = '';

    if (draftingFlowActive) {
        handleDraftingAnswer(text);
        return;
    }

    if (text.toLowerCase().includes('draft')) {
        startDraftingFlow();
        return;
    }

    callLexorvaAPI(text);
}

function addMessage(text, className) {
    const msg = document.createElement('div');
    msg.className = `message ${className}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Store in chat memory
    chatMessages.push({ role: className.includes('user') ? 'user' : 'ai', content: text });
}

function callLexorvaAPI(promptText) {
    thinkingBar.style.display = 'block';

    fetch('/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
    })
    .then(response => response.json())
    .then(data => {
        thinkingBar.style.display = 'none';
        const aiResponse = data?.choices?.[0]?.message?.content || 'Error: Unexpected response';
        addMessage(aiResponse, 'ai-message');
    })
    .catch(error => {
        console.error('Error:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to communicate with Lexorva.', 'ai-message');
    });
}

function startDraftingFlow() {
    draftingFlowActive = true;
    draftingAnswers = [];
    currentDraftingIndex = 0;
    addMessage("Please provide the following details for drafting:\n" + draftingQuestions[0], 'ai-message');
}

function handleDraftingAnswer(answer) {
    draftingAnswers.push(answer);
    currentDraftingIndex++;

    if (currentDraftingIndex < draftingQuestions.length) {
        addMessage(draftingQuestions[currentDraftingIndex], 'ai-message');
    } else {
        // Drafting complete → generate PDF preview
        draftingFlowActive = false;
        generateDraftingPDFPreview();
    }
}

function generateDraftingPDFPreview() {
    const msg = document.createElement('div');
    msg.className = 'pdf-preview';
    msg.innerHTML = `
        <strong>[PDF]</strong> Drafted_Document.pdf<br/>
        <button onclick="alert('View PDF')">View</button>
        <button onclick="alert('Edit PDF')">Edit</button>
        <button onclick="alert('Download PDF')">Download</button>
    `;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // Store in chat memory
    chatMessages.push({ role: 'ai', content: '[PDF] Drafted_Document.pdf' });
}

function handleFileUpload() {
    const file = fileUploadInput.files[0];
    if (!file) return;

    addMessage(`Uploaded file: ${file.name}`, 'user-message');

    // Example: Lexorva responds to uploaded file
    thinkingBar.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    fetch('/analyze-upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        thinkingBar.style.display = 'none';
        const aiResponse = data?.choices?.[0]?.message?.content || 'Error: Unexpected response';
        addMessage(aiResponse, 'ai-message');
    })
    .catch(error => {
        console.error('Error:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to analyze uploaded document.', 'ai-message');
    });

    // Reset file input
    fileUploadInput.value = '';
}
