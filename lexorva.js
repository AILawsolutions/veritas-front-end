// script.js

// Elements
const askModeButton = document.getElementById('askMode');
const draftModeButton = document.getElementById('draftMode');
const questionsPanel = document.getElementById('questionsPanel');
const downloadPDFButton = document.getElementById('downloadPDF');
const submitDraftButton = document.getElementById('submitDraft');
const fileUploadInput = document.getElementById('fileUpload');
const responseBox = document.getElementById('responseBox');
const submitButton = document.getElementById('submitButton');
const messageInput = document.getElementById('messageInput');

// Current mode state
let currentMode = 'ask';

// Mode switch handlers
askModeButton.addEventListener('click', () => {
    currentMode = 'ask';
    askModeButton.classList.add('active');
    draftModeButton.classList.remove('active');
    questionsPanel.classList.add('hidden');
    downloadPDFButton.classList.add('hidden');
    responseBox.innerHTML = '';
});

draftModeButton.addEventListener('click', () => {
    currentMode = 'draft';
    draftModeButton.classList.add('active');
    askModeButton.classList.remove('active');
    questionsPanel.classList.remove('hidden');
    downloadPDFButton.classList.add('hidden');
    responseBox.innerHTML = '';
});

// Submit Guided Drafting (Render PDF)
submitDraftButton.addEventListener('click', async () => {
    const docType = document.getElementById('docType').value;
    const state = document.getElementById('state').value;
    const county = document.getElementById('county').value;
    const courtName = document.getElementById('courtName').value;
    const parties = document.getElementById('parties').value;
    const facts = document.getElementById('facts').value;
    const legalIssues = document.getElementById('legalIssues').value;
    const reliefSought = document.getElementById('reliefSought').value;
    const signatureBlock = document.getElementById('signatureBlock').value;

    responseBox.innerHTML = 'Generating document...';

    try {
        const response = await fetch('https://ailawsolutions.pythonanywhere.com/render-html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                docType,
                state,
                county,
                courtName,
                parties,
                facts,
                legalIssues,
                reliefSought,
                signatureBlock
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate PDF.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'court_document.pdf';
        downloadLink.click();

        URL.revokeObjectURL(url);

        responseBox.innerHTML = 'Document ready — downloaded.';
    } catch (error) {
        responseBox.innerHTML = `Error: ${error.message}`;
    }
});

// Submit Ask Lexorva message
submitButton.addEventListener('click', sendAskLexorva);
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendAskLexorva();
    }
});

async function sendAskLexorva() {
    const message = messageInput.value.trim();
    if (!message) return;

    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'chat-entry user-entry';
    userMessageDiv.innerText = message;
    responseBox.appendChild(userMessageDiv);

    messageInput.value = '';
    responseBox.scrollTop = responseBox.scrollHeight;

    try {
        const response = await fetch('https://ailawsolutions.pythonanywhere.com/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error('Failed to communicate with Lexorva.');
        }

        const data = await response.json();
        const lexorvaResponse = data.reply || 'Error: No response from Lexorva.';

        const lexorvaMessageDiv = document.createElement('div');
        lexorvaMessageDiv.className = 'chat-entry lexorva-entry';
        lexorvaMessageDiv.innerText = lexorvaResponse;
        responseBox.appendChild(lexorvaMessageDiv);

        responseBox.scrollTop = responseBox.scrollHeight;
    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-entry error-entry';
        errorDiv.innerText = `Error: ${error.message}`;
        responseBox.appendChild(errorDiv);
    }
}
