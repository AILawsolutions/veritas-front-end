
// Toggle Ask Lexorva ↔ Drafting modes
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

document.addEventListener('DOMContentLoaded', function() {
    // Ask Lexorva submit
    document.getElementById('askSubmit').addEventListener('click', async () => {
        const userInput = document.getElementById('askInput').value.trim();
        if (!userInput) return;

        const formData = new FormData();
        formData.append('text', userInput);

        const file = document.getElementById('uploadFileAsk').files[0];
        if (file) {
            formData.append('file', file);
        }

        const responseBox = document.getElementById('askResponse');
        responseBox.value = 'Processing...';

        try {
            const response = await fetch('/analyze-upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            responseBox.value = data.response || 'No response.';
            document.getElementById('askDownloadPDF').classList.remove('hidden');
        } catch (err) {
            responseBox.value = 'Error communicating with server.';
        }
    });

    // Drafting submit
    document.getElementById('draftSubmit').addEventListener('click', async () => {
        const answers = [];
        for (let i = 0; i < 9; i++) {
            const field = document.querySelector(`[name="answer${i}"]`);
            answers.push(field ? field.value.trim() : '');
        }

        const formData = new FormData();
        formData.append('answers', JSON.stringify(answers));

        const file = document.getElementById('uploadFileDraft').files[0];
        if (file) {
            formData.append('file', file);
        }

        const responseBox = document.getElementById('draftResponse');
        responseBox.value = 'Submitting for drafting...';

        try {
            const response = await fetch('/render-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            const data = await response.json();
            responseBox.value = data.html || 'No response.';
            window.latestDraftHTML = data.html;
            document.getElementById('draftDownloadPDF').classList.remove('hidden');
        } catch (err) {
            responseBox.value = 'Error communicating with server.';
        }
    });

    // Ask Lexorva Download PDF
    document.getElementById('askDownloadPDF').addEventListener('click', async () => {
        const html = document.getElementById('askResponse').value;
        if (!html) return;

        try {
            const response = await fetch('/generate-pdf-from-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ html })
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lexorva_response.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error generating PDF.');
        }
    });

    // Drafting Download PDF
    document.getElementById('draftDownloadPDF').addEventListener('click', async () => {
        if (!window.latestDraftHTML) {
            alert('Please submit the form first.');
            return;
        }

        try {
            const response = await fetch('/generate-pdf-from-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ html: window.latestDraftHTML })
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'court_document.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error generating PDF.');
        }
    });
});
