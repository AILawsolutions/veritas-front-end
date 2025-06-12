// script.js

const askModeButton = document.getElementById('askMode');
const draftModeButton = document.getElementById('draftMode');
const questionsPanel = document.getElementById('questionsPanel');
const downloadPDFButton = document.getElementById('downloadPDF');
const fileUploadInput = document.getElementById('fileUpload');
const responseBox = document.getElementById('responseBox');
const submitButton = document.querySelector('.send-button');
const messageInput = document.querySelector('input[placeholder="Message Lexorva..."]');

let currentMode = 'ask';
let guidedQuestions = [];
let userAnswers = [];

const BACKEND_URL = 'https://AiLawSolutions.pythonanywhere.com';

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
    downloadPDFButton.classList.remove('hidden');
    responseBox.innerHTML = '';
    loadQuestions();
});

submitButton.addEventListener('click', () => {
    if (currentMode === 'ask') {
        const userPrompt = messageInput.value.trim();
        if (userPrompt) {
            askLexorva(userPrompt);
        }
    } else if (currentMode === 'draft') {
        submitDraft();
    }
});

fileUploadInput.addEventListener('change', handleFileUpload);
downloadPDFButton.addEventListener('click', downloadPDF);

async function loadQuestions() {
    try {
        const response = await fetch(`${BACKEND_URL}/questions`);
        const data = await response.json();
        guidedQuestions = data.questions;
        renderQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

function renderQuestions() {
    questionsPanel.innerHTML = '';
    userAnswers = [];

    guidedQuestions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question';

        const label = document.createElement('label');
        label.textContent = `${index + 1}. ${question}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.addEventListener('input', (e) => {
            userAnswers[index] = e.target.value;
        });

        questionElement.appendChild(label);
        questionElement.appendChild(input);
        questionsPanel.appendChild(questionElement);

        userAnswers.push('');
    });
}

async function askLexorva(promptText) {
    responseBox.innerHTML = '<p><em>Loading...</em></p>';
    try {
        const response = await fetch(`${BACKEND_URL}/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: promptText })
        });

        const data = await response.json();

        if (data.status === 'ok' && data.choices && data.choices.length > 0) {
            responseBox.innerHTML = `<p>${data.choices[0].message.content}</p>`;
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        console.error('Error asking Lexorva:', error);
        responseBox.innerHTML = '<p style="color:red;">Error: Failed to communicate with Lexorva.</p>';
    }
}

async function submitDraft() {
    responseBox.innerHTML = '<p><em>Generating document...</em></p>';
    try {
        const response = await fetch(`${BACKEND_URL}/render-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: userAnswers })
        });

        const data = await response.json();

        if (data.html) {
            responseBox.innerHTML = data.html;
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        console.error('Error generating document:', error);
        responseBox.innerHTML = '<p style="color:red;">Error: Failed to communicate with Lexorva.</p>';
    }
}

async function downloadPDF() {
    try {
        const htmlContent = responseBox.innerHTML;

        const response = await fetch(`${BACKEND_URL}/generate-pdf-from-html`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent })
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'court_document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF.');
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    responseBox.innerHTML = '<p><em>Analyzing document...</em></p>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${BACKEND_URL}/analyze-upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'ok' && data.choices && data.choices.length > 0) {
            responseBox.innerHTML = `<p>${data.choices[0].message.content}</p>`;
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        console.error('Error analyzing document:', error);
        responseBox.innerHTML = '<p style="color:red;">Error analyzing document.</p>';
    }
}
