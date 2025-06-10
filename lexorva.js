
// Toggle Ask Lexorva / Drafting
function toggleMode(mode) {
    const askBtn = document.getElementById('askToggle');
    const draftBtn = document.getElementById('draftToggle');
    const askSec = document.getElementById('askSection');
    const draftSec = document.getElementById('draftSection');

    if (mode === 'ask') {
        askBtn.classList.add('active');
        draftBtn.classList.remove('active');
        askSec.classList.remove('hidden');
        draftSec.classList.add('hidden');
    } else {
        askBtn.classList.remove('active');
        draftBtn.classList.add('active');
        askSec.classList.add('hidden');
        draftSec.classList.remove('hidden');
    }
}

// Handle Ask Lexorva Submit
document.addEventListener('DOMContentLoaded', function () {
    const askSubmitButton = document.querySelector('#askSection .styled-button:nth-of-type(2)');
    const askInput = document.querySelector('.ask-input');
    const uploadInput = document.getElementById('uploadFile');

    askSubmitButton.addEventListener('click', async function () {
        const prompt = askInput.value.trim();
        if (!prompt) {
            alert('Please enter your request.');
            return;
        }

        // Post to /analyze-text
        const response = await fetch('/analyze-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        showAskResponse(data.content || 'No response.');
    });

    // Optional: can handle upload here if needed in future
});

// Show Ask Lexorva response
function showAskResponse(content) {
    let responseBox = document.getElementById('askResponseBox');
    if (!responseBox) {
        responseBox = document.createElement('textarea');
        responseBox.id = 'askResponseBox';
        responseBox.className = 'ask-input';
        responseBox.style.height = '300px';
        document.getElementById('askSection').appendChild(responseBox);
    }
    responseBox.value = content;
}

// Handle Drafting Submit
document.addEventListener('DOMContentLoaded', function () {
    const draftSubmitButton = document.querySelector('#draftSection .button-row .styled-button:nth-of-type(1)');

    draftSubmitButton.addEventListener('click', async function () {
        const inputs = document.querySelectorAll('.draft-form input, .draft-form select');
        const answers = Array.from(inputs).map(input => input.value.trim());

        // Post to /render-html
        const response = await fetch('/render-html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });

        const data = await response.json();
        showDraftResponse(data.html || 'No response.');
    });
});

// Show Drafting response
function showDraftResponse(htmlContent) {
    let responseBox = document.getElementById('draftResponseBox');
    if (!responseBox) {
        responseBox = document.createElement('textarea');
        responseBox.id = 'draftResponseBox';
        responseBox.className = 'ask-input';
        responseBox.style.height = '400px';
        document.getElementById('draftSection').appendChild(responseBox);

        // Add Download PDF button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'styled-button';
        downloadButton.innerText = 'Download PDF';
        downloadButton.style.marginTop = '10px';
        downloadButton.addEventListener('click', downloadDraftPDF);
        document.getElementById('draftSection').appendChild(downloadButton);
    }
    responseBox.value = htmlContent;
}

// Download PDF
async function downloadDraftPDF() {
    const responseBox = document.getElementById('draftResponseBox');
    if (!responseBox) {
        alert('No draft to download.');
        return;
    }
    const htmlContent = responseBox.value;

    const response = await fetch('/generate-pdf-from-html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html: htmlContent })
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'court_document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
}
