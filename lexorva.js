
let uploadedDocumentText = null;

// Elements
const fileInput = document.getElementById('fileUpload');
const promptInput = document.getElementById('promptInput');
const submitButton = document.getElementById('submitButton');
const chatBox = document.getElementById('chatBox');
const downloadButton = document.getElementById('downloadPDF');

// File upload
fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const fileBubble = document.createElement("div");
    fileBubble.classList.add("user-message");
    fileBubble.innerText = `📄 Uploaded: ${file.name}`;
    chatBox.appendChild(fileBubble);

    try {
        const response = await fetch("https://lexorva.com/upload", {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        uploadedDocumentText = data.result || null;

        const confirmation = document.createElement("div");
        confirmation.classList.add("ai-message");
        confirmation.innerText = "✅ Document received. You may now ask follow-up questions.";
        chatBox.appendChild(confirmation);
    } catch (err) {
        const errorMsg = document.createElement("div");
        errorMsg.classList.add("ai-message");
        errorMsg.innerText = "⚠️ Error uploading file. Please try again.";
        chatBox.appendChild(errorMsg);
    }
});

// Submit prompt
submitButton.addEventListener('click', async () => {
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) return;

    const userBubble = document.createElement("div");
    userBubble.classList.add("user-message");
    userBubble.innerText = userPrompt;
    chatBox.appendChild(userBubble);
    promptInput.value = "";

    const loadingBubble = document.createElement("div");
    loadingBubble.classList.add("ai-message");
    loadingBubble.innerText = "Lexorva is thinking...";
    chatBox.appendChild(loadingBubble);

    try {
        const fullPrompt = uploadedDocumentText
            ? `${uploadedDocumentText}

Question: ${userPrompt}`
            : userPrompt;

        const response = await fetch("https://lexorva.com/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: fullPrompt })
        });

        const data = await response.json();
        const answer = data.choices[0].message.content;

        loadingBubble.remove();

        const aiResponse = document.createElement("div");
        aiResponse.classList.add("ai-message");
        aiResponse.innerText = answer;
        chatBox.appendChild(aiResponse);

        // PDF download button
        downloadButton.style.display = "block";
        downloadButton.onclick = () => {
            const blob = new Blob([answer], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "Lexorva_Strategy_Report.pdf";
            link.click();
        };
    } catch (err) {
        loadingBubble.innerText = "⚠️ Error fetching response.";
    }
});
