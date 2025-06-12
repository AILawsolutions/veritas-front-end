const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const thinkingBar = document.getElementById('thinking');
const fileUploadInput = document.getElementById('fileUpload');
const downloadPdfLink = document.getElementById('downloadPdf');

// Drafting flow state
let draftingFlowActive = false;
let draftingAnswers = [];
let currentDraftingIndex = 0;

// Guided questions (must match Master Spec)
const draftingQuestions = [
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

// Event listeners
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
fileUploadInput.addEventListener('change', handleFileUpload);
downloadPdfLink.addEventListener('click', exportChatToPdf);

// Send message
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

// Add message to chat
function addMessage(text, className) {
    const msg = document.createElement('div');
    msg.className = `message ${className}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Call Ask Lexorva mode → /proxy
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

// Start Drafting Flow
function startDraftingFlow() {
    draftingFlowActive = true;
    draftingAnswers = [];
    currentDraftingIndex = 0;
    addMessage("Please provide the following details for drafting:\n" + draftingQuestions[0], 'ai-message');
}

// Handle Drafting Answers
function handleDraftingAnswer(answer) {
    draftingAnswers.push(answer);
    currentDraftingIndex++;

    if (currentDraftingIndex < draftingQuestions.length) {
        addMessage(draftingQuestions[currentDraftingIndex], 'ai-message');
    } else {
        // All questions answered → call /render-html
        draftingFlowActive = false;
        generateDraftingDocument();
    }
}

// Call /render-html → generate document
function generateDraftingDocument() {
    thinkingBar.style.display = 'block';

    fetch('/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: draftingAnswers })
    })
    .then(response => response.json())
    .then(data => {
        thinkingBar.style.display = 'none';
        const htmlContent = data?.html || 'Error: Failed to generate document.';

        // Display PDF preview block
        const msg = document.createElement('div');
        msg.className = 'pdf-preview';
        msg.innerHTML = `
            <strong>[PDF]</strong> Drafted_Document.pdf<br/>
            <button onclick="viewPdf('${encodeURIComponent(htmlContent)}')">View</button>
            <button onclick="editPdf('${encodeURIComponent(htmlContent)}')">Edit</button>
            <button onclick="downloadDraftPdf('${encodeURIComponent(htmlContent)}')">Download</button>
        `;
        chatHistory.appendChild(msg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
        thinkingBar.style.display = 'none';
        addMessage('Error: Failed to generate PDF.', 'ai-message');
    });
}

// Upload Document → /analyze-upload
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

// View PDF (basic viewer → open new window)
function viewPdf(encodedHtml) {
    const html = decodeURIComponent(encodedHtml);
    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
}

// Edit PDF (for now → same as View, advanced editor can be added)
function editPdf(encodedHtml) {
    viewPdf(encodedHtml);
}

// Download Draft PDF
function downloadDraftPdf(encodedHtml) {
    const html = decodeURIComponent(encodedHtml);

    fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: html })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'court_document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Error downloading PDF:', error);
    });
}

// Export Chat → Basic PDF Export (Optional Spec Item)
function exportChatToPdf() {
    const chatMessages = chatHistory.innerText;

    const element = document.createElement('a');
    const file = new Blob([chatMessages], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'lexorva_chat_export.txt';
    document.body.appendChild(element);
    element.click();
}
