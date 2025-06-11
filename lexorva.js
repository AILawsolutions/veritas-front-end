const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');
const fileUploadInput = document.getElementById('fileUpload');

let chatMessages = [];
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
let lastDraftedHtml = "";

// Event listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
if (fileUploadInput) {
    fileUploadInput.addEventListener('change', handleFileUpload);
}

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
        generateRealDraftingHTML();
    }
}

function generateRealDraftingHTML() {
    thinkingBar.style.display = 'block';

    fetch('https://AiLawSolutions.pythonanywhere.com/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: draftingAnswers })
    })
    .then(response => response.json())
    .then(data => {
        thinkingBar.style.display = 'none';
        if (data?.html) {
            lastDraftedHtml = data.html;
            addPdfPreview();
        } else {
            addMessage('Error: Failed to generate PDF.', 'ai-message');
        }
    })
    .catch(error => {
        console.error('Error generating PDF:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to generate PDF.', 'ai-message');
    });
}

function addPdfPreview() {
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

    chatMessages.push({ role: 'ai', content: '[PDF] Court_Document.pdf' });
}

function viewPDF() {
    const modal = document.createElement('div');
    modal.className = 'pdf-modal';
    modal.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:8px; max-height:80vh; overflow:auto;">
            <h3>View PDF</h3>
            <div style="border:1px solid #ccc; padding:10px; font-family:Times New Roman; white-space:pre-wrap;">${lastDraftedHtml}</div>
            <br/><button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function editPDF() {
    const modal = document.createElement('div');
    modal.className = 'pdf-modal';
    modal.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:8px; max-height:80vh; overflow:auto;">
            <h3>Edit PDF</h3>
            <textarea id="editArea" style="width:100%; height:400px;">${lastDraftedHtml}</textarea>
            <br/>
            <button onclick="saveEdit()">Save & Close</button>
            <button onclick="this.parentElement.parentElement.remove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveEdit() {
    const newHtml = document.getElementById('editArea').value;
    lastDraftedHtml = newHtml;
    document.querySelector('.pdf-modal').remove();
}

function downloadPDF() {
    thinkingBar.style.display = 'block';

    fetch('https://AiLawSolutions.pythonanywhere.com/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: lastDraftedHtml })
    })
    .then(response => {
        thinkingBar.style.display = 'none';
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Court_Document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => {
        console.error('Error downloading PDF:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to download PDF.', 'ai-message');
    });
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
        console.error('Error analyzing upload:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to analyze uploaded document.', 'ai-message');
    });

    fileUploadInput.value = '';
}
