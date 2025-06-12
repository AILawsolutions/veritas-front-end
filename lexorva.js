// FINAL script.js for MASTER PLAN Lexorva AI
// Works perfectly with your current app.py → LEXIS-NEXIS killer flow

const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');
const fileUploadInput = document.getElementById('fileUpload');

let chatMessages = []; // Store chat memory

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

        if (data.error) {
            addMessage(`Error: ${data.error}`, 'ai-message');
            return;
        }

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
        generateDraftingPDF();
    }
}

function generateDraftingPDF() {
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
            addMessage(`Error: ${data.error}`, 'ai-message');
            return;
        }

        const htmlContent = data.html || '';

        // Show PDF preview block
        const msg = document.createElement('div');
        msg.className = 'pdf-preview';
        msg.innerHTML = `
            <strong>[PDF]</strong> Drafted_Court_Document.pdf<br/>
            <button onclick="viewPDF()">View</button>
            <button onclick="editPDF()">Edit</button>
            <button onclick="downloadPDF()">Download</button>
        `;
        chatHistory.appendChild(msg);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Store latest HTML for export
        latestDraftHTML = htmlContent;
    })
    .catch(error => {
        console.error('Error:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to generate PDF.', 'ai-message');
    });
}

let latestDraftHTML = '';

function viewPDF() {
    if (!latestDraftHTML) return alert('No PDF available yet.');

    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write(latestDraftHTML);
    pdfWindow.document.close();
}

function editPDF() {
    if (!latestDraftHTML) return alert('No PDF available yet.');

    const blob = new Blob([latestDraftHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

function downloadPDF() {
    if (!latestDraftHTML) return alert('No PDF available yet.');

    fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: latestDraftHTML })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Drafted_Court_Document.pdf';
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
            addMessage(`Error: ${data.error}`, 'ai-message');
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
