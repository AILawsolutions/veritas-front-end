
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
    document.getElementById('askSubmit').addEventListener('click', async () => {
        const askInput = document.getElementById('askInput').value;
        const responseBox = document.getElementById('askResponse');
        responseBox.value = "Processing...";

        const formData = new FormData();
        formData.append('text', askInput);

        const file = document.getElementById('uploadFileAsk').files[0];
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('https://ailawsolutions.pythonanywhere.com/analyze-upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            responseBox.value = data.response || 'No response received.';
        } catch (error) {
            responseBox.value = 'Error contacting server.';
        }
    });

    document.getElementById('draftSubmit').addEventListener('click', async () => {
        const answers = [];
        for (let i = 0; i < 9; i++) {
            const field = document.querySelector(`[name="answer${i}"]`);
            answers.push(field ? field.value.trim() : '');
        }

        const responseBox = document.getElementById('draftResponse');
        responseBox.value = "Processing...";

        try {
            const response = await fetch('https://ailawsolutions.pythonanywhere.com/render-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const data = await response.json();
            responseBox.value = data.html || 'No draft received.';
            window.latestDraftHTML = data.html;
        } catch (error) {
            responseBox.value = 'Error contacting server.';
        }
    });

    document.getElementById('downloadDraftPdf').addEventListener('click', async () => {
        if (!window.latestDraftHTML) {
            alert('Please submit the form first.');
            return;
        }

        try {
            const response = await fetch('https://ailawsolutions.pythonanywhere.com/generate-pdf-from-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        } catch (error) {
            alert('Error generating PDF.';
        }
    });
});
