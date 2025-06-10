
function toggleMode(mode) {
    const askBtn = document.getElementById('askToggle');
    const draftBtn = document.getElementById('draftToggle');
    const guidedPanel = document.getElementById('guidedPanel');
    const responseHeading = document.getElementById('responseHeading');
    const downloadRow = document.getElementById('downloadRow');

    if (mode === 'ask') {
        askBtn.classList.add('active');
        draftBtn.classList.remove('active');
        guidedPanel.classList.add('hidden');
        responseHeading.textContent = 'LEXORVA Response';
        downloadRow.classList.add('hidden');
    } else {
        askBtn.classList.remove('active');
        draftBtn.classList.add('active');
        guidedPanel.classList.remove('hidden');
        responseHeading.textContent = 'LEXORVA Drafted Document';
        downloadRow.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('mainSubmit').addEventListener('click', async () => {
        const inputText = document.getElementById('mainInput').value;
        const mode = document.getElementById('askToggle').classList.contains('active') ? 'ask' : 'draft';
        const responseBox = document.getElementById('mainResponse');
        responseBox.value = "Processing...";

        if (mode === 'ask') {
            const formData = new FormData();
            formData.append('text', inputText);

            const file = document.getElementById('uploadFile').files[0];
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
        } else {
            const form = document.getElementById('draftForm');
            const answers = [];
            form.querySelectorAll('input').forEach(field => {
                answers.push(field.value.trim());
            });

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
        }
    });

    document.getElementById('downloadPDF').addEventListener('click', async () => {
        if (!window.latestDraftHTML) {
            alert('Please submit the draft first.');
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
            alert('Error generating PDF.');
        }
    });
});
