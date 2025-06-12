// script.js — FULL MASTER PLAN VERSION

// Elements
const askModeButton = document.getElementById('askMode');
const draftModeButton = document.getElementById('draftMode');
const submitButton = document.getElementById('submitButton');
const downloadPDFButton = document.getElementById('downloadPDF');
const responseBox = document.getElementById('responseBox');
const questionsPanel = document.getElementById('questionsPanel');
const fileUploadInput = document.getElementById('fileUpload');

let currentMode = 'ask';
let latestHTMLContent = '';

// MODE SWITCH
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

// ASK LEXORVA FLOW
async function sendAskLexorva(message) {
    responseBox.innerHTML = '<em>Lexorva is thinking...</em>';

    try {
        const response = await fetch('/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_input: message })
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        const lexorvaReply = data.reply || 'No response from Lexorva.';

        responseBox.innerHTML = `<div class="lexorva-reply">${lexorvaReply}</div>`;
    } catch (error) {
        responseBox.innerHTML = `<div class="error">Error: Failed to communicate with Lexorva.</div>`;
        console.error('Error communicating with Lexorva:', error);
    }
}

// GUIDED DRAFTING FLOW
async function generateDraftingPDF() {
    responseBox.innerHTML = '<em>Generating court-formatted document...</em>';

    const draftingData = {
        document_type: document.getElementById('documentType').value,
        state: document.getElementById('state').value,
        county: document.getElementById('county').value,
        court_name: document.getElementById('courtName').value,
        parties_involved: document.getElementById('partiesInvolved').value,
        key_facts: document.getElementById('keyFacts').value,
        legal_issues: document.getElementById('legalIssues').value,
        relief_sought: document.getElementById('reliefSought').value,
        signature_block: document.getElementById('signatureBlock').value
    };

    try {
        const response = await fetch('/render-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draftingData)
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        latestHTMLContent = data.html || '';

        responseBox.innerHTML = `
            <iframe srcdoc="${latestHTMLContent}" style="width: 100%; height: 600px; border: 1px solid #ccc;"></iframe>
        `;

        downloadPDFButton.classList.remove('hidden');
    } catch (error) {
        responseBox.innerHTML = `<div class="error">Error: Failed to generate PDF.</div>`;
        console.error('Error generating PDF:', error);
    }
}

// DOWNLOAD PDF
downloadPDFButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: latestHTMLContent })
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'Lexorva_Court_Document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        alert('Error downloading PDF.');
        console.error('PDF download error:', error);
    }
});

// EVIDENCE UPLOAD FLOW (PREPPED FOR MASTER PLAN)
fileUploadInput.addEventListener('change', async () => {
    const file = fileUploadInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    responseBox.innerHTML = '<em>Analyzing uploaded evidence...</em>';

    try {
        const response = await fetch('/analyze-upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        const analysisResult = data.analysis || 'No analysis result.';

        responseBox.innerHTML = `<div class="lexorva-reply">${analysisResult}</div>`;
    } catch (error) {
        responseBox.innerHTML = `<div class="error">Error analyzing uploaded file.</div>`;
        console.error('File upload analysis error:', error);
    }
});

// STRATEGY REPORT FLOW (PREPPED FOR MASTER PLAN)
async function generateStrategyReport() {
    responseBox.innerHTML = '<em>Generating Strategy Report...</em>';

    try {
        const response = await fetch('/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        const reportHTML = data.report_html || '';

        responseBox.innerHTML = `
            <iframe srcdoc="${reportHTML}" style="width: 100%; height: 600px; border: 1px solid #ccc;"></iframe>
        `;
    } catch (error) {
        responseBox.innerHTML = `<div class="error">Error: Failed to generate Strategy Report.</div>`;
        console.error('Strategy Report error:', error);
    }
}

// MESSAGE SUBMIT HANDLER
submitButton.addEventListener('click', () => {
    const userInput = document.getElementById('userInput').value;

    if (currentMode === 'ask') {
        sendAskLexorva(userInput);
    } else if (currentMode === 'draft') {
        generateDraftingPDF();
    }
});
