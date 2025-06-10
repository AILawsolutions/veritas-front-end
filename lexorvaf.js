
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

document.getElementById('askSubmitButton').addEventListener('click', async () => {
    const inputText = document.getElementById('askInput').value;
    const responseBox = document.getElementById('askResponseBox');
    responseBox.value = 'Processing...';

    // Call your backend /analyze endpoint here
    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: inputText })
        });
        const data = await response.json();
        responseBox.value = data.response || 'No response.';
    } catch (error) {
        responseBox.value = 'Error contacting server.';
    }
});

document.getElementById('draftSubmitButton').addEventListener('click', async () => {
    const formData = new FormData(document.getElementById('draftForm'));
    const answers = [
        formData.get('docType'),
        formData.get('state'),
        formData.get('county'),
        formData.get('courtName'),
        formData.get('partiesInvolved'),
        formData.get('keyFacts'),
        formData.get('legalIssues'),
        formData.get('conclusion'),
        formData.get('attorneySignature')
    ];

    const responseBox = document.getElementById('draftResponseBox');
    responseBox.value = 'Processing...';

    // Call your backend /render-html endpoint here
    try {
        const response = await fetch('http://localhost:5000/render-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: answers })
        });
        const data = await response.json();
        responseBox.value = data.html || 'No response.';
    } catch (error) {
        responseBox.value = 'Error contacting server.';
    }
});

document.getElementById('downloadDraftPdfButton').addEventListener('click', async () => {
    const htmlContent = document.getElementById('draftResponseBox').value;

    try {
        const response = await fetch('http://localhost:5000/generate-pdf-from-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: htmlContent })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'court_document.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error generating PDF.');
    }
});
