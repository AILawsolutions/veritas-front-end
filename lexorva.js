
// Toggle between Ask Lexorva and Drafting modes
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
    const askSubmit = document.getElementById('askSubmit');
    if (askSubmit) {
        askSubmit.addEventListener('click', async () => {
            const userInput = document.getElementById('askInput').value.trim();
            if (!userInput) return;

            const formData = new FormData();
            formData.append('text', userInput);

            const file = document.getElementById('uploadFile').files[0];
            if (file) {
                formData.append('file', file);
            }

            const responseBox = document.getElementById('askResponse');
            responseBox.innerText = 'Processing...';

            try {
                const response = await fetch('https://YOUR_BACKEND_URL/analyze-upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                responseBox.innerText = data.response || 'No response.';
            } catch (err) {
                responseBox.innerText = 'Error communicating with server.';
            }
        });
    }

    // Drafting submit
    const draftSubmit = document.getElementById('draftSubmit');
    if (draftSubmit) {
        draftSubmit.addEventListener('click', async () => {
            const answers = [];
            for (let i = 0; i < 9; i++) {
                const field = document.querySelector(`[name="answer${i}"]`);
                answers.push(field ? field.value.trim() : '');
            }

            const responseBox = document.getElementById('draftResponse');
            responseBox.innerText = 'Submitting for drafting...';

            try {
                const response = await fetch('https://YOUR_BACKEND_URL/render-html', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ answers })
                });

                const data = await response.json();
                responseBox.innerHTML = data.html || 'No response.';

                // Store HTML for download
                window.latestDraftHTML = data.html;
            } catch (err) {
                responseBox.innerText = 'Error communicating with server.';
            }
        });
    }

    // Download PDF button
    const downloadPDF = document.getElementById('downloadPDF');
    if (downloadPDF) {
        downloadPDF.addEventListener('click', async () => {
            if (!window.latestDraftHTML) {
                alert('Please submit the form first.');
                return;
            }

            try {
                const response = await fetch('https://YOUR_BACKEND_URL/generate-pdf-from-html', {
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
    }
});
