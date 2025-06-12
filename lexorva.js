// script.js — FINAL MASTER PLAN COMPATIBLE

const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');
const fileUploadInput = document.getElementById('fileUpload');
const downloadPDFButton = document.getElementById('downloadPDF');

// Drafting flow state
let draftingFlowActive = false;
let draftingQuestions = [
    "What type of document are you drafting? (e.g., Motion, Notice, Complaint)",
    "Which state is this court located in?",
    "Which county is this court located in?",
    "Which specific court is this for? (full court name)",
    "Who are the parties involved in this case?",
    "Summarize the key facts of the case.",
    "What are the legal issues involved?",
    "What conclusion or relief are you seeking from the court?",
    "What is the attorney signature block? (name, firm, address, contact)"
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
downloadPDFButton.addEventListener('click', downloadPDF);

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

        if (data.error) {
            addMessage('Error: ' + data.error, 'ai-message');
        } else {
            const aiResponse = data?.choices?.[0]?.message?.content || 'Error: Unexpected response';
            addMessage(aiResponse, 'ai-message');
        }
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
    thinkingBar.style.display = 'block';

    fetch('/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: draftingAnswers })
    })
    .then(response => response.json())
    .then(data => {
        thinkingBar.style.display = 'none';

        if (data.error) {
            addMessage('Error: ' + data.error, 'ai-message');
            return;
        }

        // Show PDF preview block
        const msg = document.createElement('div');
        msg.className = 'pdf-preview';
        msg.innerHTML = `
            <strong>[PDF]</strong> Court_Document.pdf<br/>
            <button onclick="viewPDF()">View</button>
            <button onclick="editPDF()">Edit</button>
            <button onclick="downloadPDF()">Download</button>
        `;
        chatHistory.appendChild(msg);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Save HTML for download
        window.latestDraftHTML = data.html;
    })
    .catch(error => {
        console.error('Error:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to generate PDF.', 'ai-message');
    });
}

function downloadPDF() {
    if (!window.latestDraftHTML) {
        alert('No PDF draft available.');
        return;
    }

    fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: window.latestDraftHTML })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Court_Document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: Failed to download PDF.');
    });
}

function viewPDF() {
    if (!window.latestDraftHTML) {
        alert('No PDF draft available.');
        return;
    }

    fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: window.latestDraftHTML })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: Failed to view PDF.');
    });
}

function editPDF() {
    alert('Edit PDF feature coming soon!');
}

function handleFileUpload() {
    const file = fileUploadInput.files[0];
    if (!file) return;

    addMessage(`Uploaded file: ${file.name}`, 'user-message');

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

        if (data.error) {
            addMessage('Error: ' + data.error, 'ai-message');
            return;
        }

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
