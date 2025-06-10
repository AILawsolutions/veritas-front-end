
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

function submitAsk() {
    const input = document.getElementById('askInput').value;
    const responseBox = document.getElementById('askResponse');
    responseBox.value = "Processing...";
    fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
    })
    .then(response => response.json())
    .then(data => {
        responseBox.value = data.response || 'No response received.';
    })
    .catch(error => {
        responseBox.value = 'Error: ' + error;
    });
}

function submitDraft() {
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
        formData.get('signatureBlock')
    ];
    const responseBox = document.getElementById('draftResponse');
    responseBox.value = "Processing...";
    fetch('http://127.0.0.1:5000/render-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answers })
    })
    .then(response => response.json())
    .then(data => {
        responseBox.value = data.html || 'No draft received.';
    })
    .catch(error => {
        responseBox.value = 'Error: ' + error;
    });
}

function downloadPDF() {
    const htmlContent = document.getElementById('draftResponse').value;
    fetch('http://127.0.0.1:5000/generate-pdf-from-html', {
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
    })
    .catch(error => {
        alert('Error generating PDF: ' + error);
    });
}
