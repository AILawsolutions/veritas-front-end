
// script_final.js

// Mode buttons
const askModeButton = document.getElementById('askMode');
const draftModeButton = document.getElementById('draftMode');
const questionsPanel = document.getElementById('questionsPanel');
const downloadPDFButton = document.getElementById('downloadPDF');
const fileUploadInput = document.getElementById('fileUpload');
const responseBox = document.getElementById('responseBox');
const submitButton = document.getElementById('submitButton');
const mainInput = document.getElementById('mainInput');

// Current mode state
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

// Upload button behavior
const uploadButtonLabel = document.querySelector('.upload-button');
uploadButtonLabel.addEventListener('click', () => {
    fileUploadInput.click();
});

fileUploadInput.addEventListener('change', () => {
    const file = fileUploadInput.files[0];
    if (file) {
        // For now, just show basic confirmation (future: process file)
        responseBox.value = `File "${file.name}" uploaded. Ready for processing.`;
    }
});

// Submit button behavior
submitButton.addEventListener('click', async () => {
    let userInput = '';

    if (currentMode === 'ask') {
        userInput = mainInput.value;
    } else if (currentMode === 'draft') {
        const questions = document.querySelectorAll('.questions-grid input');
        userInput = 'Drafting request:\n\n';
        questions.forEach((input, index) => {
            userInput += `Q${index + 1}: ${input.value}\n`;
        });
        userInput += `\nAdditional Input:\n${mainInput.value}`;
    }

    if (userInput && userInput.trim() !== '') {
        responseBox.value = 'Lexorva is processing your request... Please wait.';

        try {
            // Example API call (replace '/proxy' with your real endpoint)
            const response = await fetch('/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: userInput
                })
            });

            const data = await response.json();

            if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                responseBox.value = data.choices[0].message.content;
            } else {
                responseBox.value = 'Error: Received unexpected response format.';
            }
        } catch (error) {
            console.error('Error submitting to Lexorva:', error);
            responseBox.value = 'Error: Failed to communicate with Lexorva.';
        }
    }
});

// Download PDF behavior
downloadPDFButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf; // Assumes jspdf is included via <script> tag or CDN

    const doc = new jsPDF();
    const text = responseBox.value;

    const splitText = doc.splitTextToSize(text, 180); // 180 mm width for A4

    doc.setFont('Helvetica');
    doc.setFontSize(12);
    doc.text(splitText, 15, 20);

    doc.save('Lexorva_Document.pdf');
});
