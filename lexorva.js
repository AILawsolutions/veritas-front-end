let uploadedText = "";
let uploadedFilename = "";

document.getElementById('fileInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    uploadedFilename = file.name;

    const filePreview = document.createElement('div');
    filePreview.className = 'file-preview';
    filePreview.innerHTML = `<strong>📄 ${file.name}</strong>`;
    document.getElementById("chatbox").appendChild(filePreview);

    try {
        const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        if (data.result) {
            uploadedText = data.result;
        } else {
            uploadedText = "";
        }
    } catch (error) {
        uploadedText = "";
    }
});

document.getElementById("userInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendPrompt();
    }
});

document.getElementById("sendButton").addEventListener("click", sendPrompt);

async function sendPrompt() {
    const inputElement = document.getElementById("userInput");
    const userPrompt = inputElement.value.trim();
    if (!userPrompt) return;

    const chatbox = document.getElementById("chatbox");
    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.innerText = userPrompt;
    chatbox.appendChild(userBubble);
    inputElement.value = "";

    const loadingBubble = document.createElement("div");
    loadingBubble.className = "bubble ai loading";
    loadingBubble.innerText = "Lexorva is thinking...";
    chatbox.appendChild(loadingBubble);

    const finalPrompt = uploadedText
        ? `Document content:
${uploadedText}

User question:
${userPrompt}`
        : userPrompt;

    try {
        const response = await fetch("http://localhost:5000/proxy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: finalPrompt })
        });

        const data = await response.json();
        loadingBubble.remove();

        const aiBubble = document.createElement("div");
        aiBubble.className = "bubble ai";
        typeWriterEffect(data.choices[0].message.content, aiBubble);
        chatbox.appendChild(aiBubble);

        // Show Download Button
        const downloadBtn = document.getElementById("downloadBtn");
        if (finalPrompt.toLowerCase().includes("strategy report")) {
            downloadBtn.style.display = "block";
            downloadBtn.onclick = () => downloadPDF(data.choices[0].message.content);
        } else {
            downloadBtn.style.display = "none";
        }

    } catch (error) {
        loadingBubble.remove();
        const errorBubble = document.createElement("div");
        errorBubble.className = "bubble ai";
        errorBubble.innerText = "⚠️ An error occurred. Please try again.";
        chatbox.appendChild(errorBubble);
    }
}

function typeWriterEffect(text, element) {
    let i = 0;
    const speed = 15;
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

function downloadPDF(content) {
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Lexorva_Strategy_Report.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
