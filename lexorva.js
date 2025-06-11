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
let latestPdfBlobUrl = null; // store latest PDF blob URL

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

    chatMessages.push({ role: className.includes('user') ? 'user' : 'ai', content: text });
}

function callLexorvaAPI(promptText) {
    thinkingBar.style.display = 'block';

    fetch('https://AiLawSolutions.pythonanywhere.com/proxy', {
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
        draftingFlowActive = false;
        generateDraftingPDF();
    }
}

function generateDraftingPDF() {
    thinkingBar.style.display = 'block';

    fetch('https://AiLawSolutions.pythonanywhere.com/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: draftingAnswers })
    })
    .then(response => response.json())
    .then(data => {
        const html = data?.html;
        if (!html) throw new Error("No HTML returned.");

        // Now generate PDF
        return fetch('https://AiLawSolutions.pythonanywhere.com/generate-pdf-from-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: html })
        });
    })
    .then(response => response.blob())
    .then(blob => {
        thinkingBar.style.display = 'none';
        latestPdfBlobUrl = URL.createObjectURL(blob);
        showPdfPreview();
    })
    .catch(error => {
        console.error('Error in Drafting PDF:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to generate PDF.', 'ai-message');
    });
}

function showPdfPreview() {
    const msg = document.createElement('div');
    msg.className = 'pdf-preview';
    msg.innerHTML = `
        <strong>[PDF]</strong> Drafted_Document.pdf<br/>
        <button onclick="viewPdf()">View</button>
        <button onclick="editPdf()">Edit</button>
        <button onclick="downloadPdf()">Download</button>
    `;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function viewPdf() {
    if (!latestPdfBlobUrl) return;

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
        <div style="width: 80%; height: 80%; background: white; padding: 10px; position: relative;">
            <iframe src="${latestPdfBlobUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px;">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function editPdf() {
    if (!latestPdfBlobUrl) return;

    // Simple phase 1 → show PDF as editable HTML text (safe fallback, not PDF.js yet)
    fetch(latestPdfBlobUrl)
    .then(response => response.text())
    .then(text => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        modal.innerHTML = `
            <div style="width: 80%; height: 80%; background: white; padding: 10px; position: relative; overflow: auto;">
                <div contenteditable="true" style="width: 100%; height: 100%; border: 1px solid #ccc; padding: 10px;">${text}</div>
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px;">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    })
    .catch(error => {
        console.error('Error fetching PDF for edit:', error);
        alert('Failed to load PDF for editing.');
    });
}

function downloadPdf() {
    if (!latestPdfBlobUrl) return;

    const link = document.createElement('a');
    link.href = latestPdfBlobUrl;
    link.download = 'Drafted_Document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleFileUpload() {
    const file = fileUploadInput.files[0];
    if (!file) return;

    addMessage(`Uploaded file: ${file.name}`, 'user-message');

    thinkingBar.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    fetch('https://AiLawSolutions.pythonanywhere.com/analyze-upload', {
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

    fileUploadInput.value = '';
}
