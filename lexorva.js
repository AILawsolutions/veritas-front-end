// script.js

// Mode buttons
const askModeButton = document.getElementById('askMode');
const draftModeButton = document.getElementById('draftMode');
const questionsPanel = document.getElementById('questionsPanel');
const downloadPDFButton = document.getElementById('downloadPDF');
const fileUploadInput = document.getElementById('fileUpload');
const responseBox = document.getElementById('responseBox');
const submitButton = document.getElementById('submitButton');

const messageInput = document.getElementById('messageInput');
const sendButton = document.querySelector('.send-button');

let currentMode = 'ask';

// Mode switch handlers
askModeButton.addEventListener('click', () => {
    currentMode = 'ask';
    askModeButton.classList.add('active');
    draftModeButton.classList.remove('active');
    questionsPanel.classList.add('hidden');
    downloadPDFButton.classList.add('hidden');
});

draftModeButton.addEventListener('click', () => {
    currentMode = 'draft';
    draftModeButton.classList.add('active');
    askModeButton.classList.remove('active');
    questionsPanel.classList.remove('hidden');
    downloadPDFButton.classList.remove('hidden');
});

// Load questions for Drafting Guide
fetch('/questions')
    .then(response => response.json())
    .then(data => {
        const questions = data.questions;
        questionsPanel.innerHTML = '';
        questions.forEach((question, index) => {
            const label = document.createElement('label');
            label.textContent = `${index + 1}. ${question}`;
            const input = document.createElement('input');
            input.type = 'text';
            input.classList.add('answer');
            questionsPanel.appendChild(label);
            questionsPanel.appendChild(input);
        });
    });

// Send button handler
sendButton.addEventListener('click', () => {
    if (currentMode === 'ask') {
        const userPrompt = messageInput.value.trim();
        if (userPrompt) {
            askLexorva(userPrompt);
            messageInput.value = '';
        }
    } else if (currentMode === 'draft') {
        submitDraft();
    }
});

// Ask Lexorva function (works with app.py /proxy route)
function askLexorva(userPrompt) {
    responseBox.innerHTML += `<div class="user-message">${userPrompt}</div>`;
    fetch('/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            responseBox.innerHTML += `<div class="error">Error: ${data.error}</div>`;
        } else {
            const reply = data.choices[0].message.content;
            responseBox.innerHTML += `<div class="lexorva-message">${reply}</div>`;
        }
    })
    .catch(error => {
        responseBox.innerHTML += `<div class="error">Error: Failed to communicate with Lexorva.</div>`;
    });
}

// Submit Draft button
submitButton.addEventListener('click', () => {
    if (currentMode === 'draft') {
        submitDraft();
    }
});

function submitDraft() {
    const answers = Array.from(document.querySelectorAll('.answer')).map(input => input.value.trim());

    fetch('/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            responseBox.innerHTML = `<div class="error">Error: ${data.error}</div>`;
        } else {
            responseBox.innerHTML = data.html;
        }
    })
    .catch(error => {
        responseBox.innerHTML = `<div class="error">Error: Failed to generate document.</div>`;
    });
}

// Download PDF button
downloadPDFButton.addEventListener('click', () => {
    const htmlContent = responseBox.innerHTML;

    fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent })
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
    });
});
