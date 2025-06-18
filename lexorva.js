let uploadedFile = null;

document.getElementById('fileUpload').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        uploadedFile = file; // persist file across session
        const fileBubble = document.createElement('div');
        fileBubble.classList.add('message', 'user-message');
        fileBubble.innerHTML = `<strong>📄 ${file.name}</strong>`;
        document.getElementById('chatBox').appendChild(fileBubble);
    }
});

document.getElementById('userInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('sendButton').click();
    }
});

document.getElementById('sendButton').addEventListener('click', async function () {
    const userInput = document.getElementById('userInput').value.trim();
    if (userInput === '') return;

    // Append user message
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.textContent = userInput;
    document.getElementById('chatBox').appendChild(userMessage);
    document.getElementById('userInput').value = '';

    // Append assistant message container
    const assistantMessage = document.createElement('div');
    assistantMessage.classList.add('message', 'assistant-message');
    const responseText = document.createElement('span');
    assistantMessage.appendChild(responseText);
    document.getElementById('chatBox').appendChild(assistantMessage);

    // Hide PDF button while loading
    const existingPDF = document.getElementById('downloadPDF');
    if (existingPDF) existingPDF.remove();

    // Prepare request
    const formData = new FormData();
    formData.append('prompt', userInput);
    if (uploadedFile) {
        formData.append('file', uploadedFile);
    }

    try {
        const response = await fetch('/proxy', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            responseText.textContent = fullText;
        }

        // Show subtle download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'downloadPDF';
        downloadBtn.textContent = 'Download Strategy Report';
        downloadBtn.style.marginTop = '10px';
        downloadBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        downloadBtn.style.color = 'white';
        downloadBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        downloadBtn.style.padding = '6px 12px';
        downloadBtn.style.borderRadius = '5px';
        downloadBtn.style.fontSize = '13px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.transition = 'all 0.2s ease';
        downloadBtn.onmouseover = () => {
            downloadBtn.style.background = 'rgba(255, 255, 255, 0.12)';
        };
        downloadBtn.onmouseout = () => {
            downloadBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        };
        downloadBtn.addEventListener('click', () => {
            const blob = new Blob([fullText], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Lexorva_Strategy_Report.pdf';
            link.click();
        });

        assistantMessage.appendChild(downloadBtn);
    } catch (error) {
        responseText.textContent = '⚠️ Error: ' + error.message;
    }
});
