document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";
    let uploadedFile = null;

    // Create the download button (initially hidden)
    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadPDF";
    downloadButton.textContent = "⬇️ Download Strategy Report";
    downloadButton.style = `
        display: none;
        background: transparent;
        border: 1px solid #C168F9;
        color: #C168F9;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 14px;
        font-family: 'Rajdhani', sans-serif;
        cursor: pointer;
        margin-top: 12px;
    `;
    // We'll insert the download button after the AI response when appropriate
    // (so it doesn’t appear until a complete report is ready)

    // File upload – show a bubble (like ChatGPT) that stays until you send your question
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;
        uploadedFile = file;

        // Remove any previous file preview
        const prev = document.getElementById("filePreview");
        if (prev) prev.remove();

        // Create a new file preview bubble
        const fileBubble = document.createElement("div");
        fileBubble.id = "filePreview";
        fileBubble.classList.add("user-message");
        fileBubble.style.marginBottom = "4px";
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong> 
            <button style="margin-left: 10px; background: none; border: none; color: inherit; cursor: pointer;" onclick="removeFile()">❌</button>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    window.removeFile = () => {
        uploadedFile = null;
        const fileTag = document.getElementById("filePreview");
        if (fileTag) fileTag.remove();
        fileUploadInput.value = "";
    };

    // Allow Enter (without Shift) to send the message
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Handle send button press
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return; // Do nothing if both are empty

        // Append the user's text message as a bubble beneath the file preview (if any)
        if (message) {
            appendMessage("user", message);
        }
        // Clear input (but do not remove file preview here because we want to keep the document loaded)
        chatInput.value = "";

        // Create the thinking bubble for Lexorva's answer
        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let response;
            // If there is an uploaded document, send it along with the prompt
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                formData.append("prompt", message);
                response = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData,
                });
                // Once submitted, clear the uploaded file information from the input
                uploadedFile = null;
                const filePreview = document.getElementById("filePreview");
                if (filePreview) filePreview.remove();
                fileUploadInput.value = "";
            } else {
                response = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message }),
                });
            }

            const data = await response.json();
            const reply = data.result || data.response || (data.choices?.[0]?.message?.content) || "Error: No response from Lexorva.";
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(reply), () => {
                // Only display the download button if the reply appears to be a full strategy report.
                // (For example, if it contains key phrases like 'Strategy Report' etc.)
                if (reply.toLowerCase().includes("strategy report")) {
                    // Remove any previous download button (to avoid duplicates)
                    const existingDownload = document.getElementById("downloadPDF");
                    if (existingDownload) existingDownload.remove();
                    // Reinsert the download button directly after the response bubble
                    downloadButton.style.display = "inline-block";
                    chatHistory.insertBefore(downloadButton, thinkingDiv.nextSibling);
                } else {
                    downloadButton.style.display = "none";
                }
            });
        } catch (error) {
            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, "Error: Failed to communicate with Lexorva.");
        }
    });

    function appendMessage(sender, html) {
        const div = document.createElement("div");
        div.className = sender === "user" ? "user-message" : "ai-message";
        div.innerHTML = html;
        chatHistory.appendChild(div);
        smoothScrollToBottom();
        return div;
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior: "smooth"
        });
    }

    function typeMessage(div, fullHTML, callback) {
        div.innerHTML = "";
        const temp = document.createElement("div");
        temp.innerHTML = fullHTML;
        const text = temp.textContent || temp.innerText || "";
        let idx = 0;
        function type() {
            if (idx < text.length) {
                div.innerHTML += text.charAt(idx);
                idx++;
                smoothScrollToBottom();
                setTimeout(type, 10);
            } else {
                div.innerHTML = fullHTML;
                smoothScrollToBottom();
                if (callback) callback();
            }
        }
        type();
    }

    let thinkingInterval;
    function startThinkingDots(div) {
        // Hide the download button while processing
        downloadButton.style.display = "none";
        let count = 0;
        thinkingInterval = setInterval(() => {
            count = (count + 1) % 4;
            div.innerHTML = "Thinking" + ".".repeat(count);
            smoothScrollToBottom();
        }, 500);
    }

    function stopThinkingDots(div) {
        clearInterval(thinkingInterval);
        div.innerHTML = "";
    }
});
