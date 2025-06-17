document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://ailawsolutions.pythonanywhere.com";

    let uploadedFile = null;

    // Handle file selection
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        scrollToBottom();
    });

    // Reset file input
    function resetUpload() {
        uploadedFile = null;
        fileUploadInput.value = "";
    }

    // Send on Enter
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send button logic
    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinking = appendMessage("lexorva", "Thinking<span class='dots'></span>");
        animateDots(thinking);

        try {
            // Upload file if exists
            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);

                await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });

                resetUpload();
            }

            // Send message to /proxy
            if (message) {
                const res = await fetch(`${BACKEND_URL}/proxy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: message })
                });

                const data = await res.json();
                const reply = data.response || "⚠️ Unexpected response from Lexorva.";

                stopDots(thinking);
                typeText(thinking, marked.parse(reply));
            } else {
                stopDots(thinking);
                thinking.remove();
            }

        } catch (err) {
            stopDots(thinking);
            typeText(thinking, "⚠️ Error: Could not connect to Lexorva backend.");
        }
    });

    // Add message to chat
    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = role === "user" ? "user-message" : "ai-message";
        msg.innerHTML = text;
        chatHistory.appendChild(msg);
        scrollToBottom();
        return msg;
    }

    // Typewriter effect
    function typeText(el, htmlContent) {
        el.innerHTML = "";
        const temp = document.createElement("div");
        temp.innerHTML = htmlContent;
        const plain = temp.textContent || temp.innerText || "";
        let i = 0;
        function type() {
            if (i < plain.length) {
                el.innerHTML += plain.charAt(i++);
                scrollToBottom();
                setTimeout(type, 15);
            } else {
                el.innerHTML = htmlContent;
                scrollToBottom();
            }
        }
        type();
    }

    // Scroll bottom
    function scrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    // Thinking dots
    let dotInterval;
    function animateDots(el) {
        let dots = 0;
        dotInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            el.innerHTML = "Thinking" + ".".repeat(dots);
        }, 500);
    }

    function stopDots(el) {
        clearInterval(dotInterval);
        el.innerHTML = "";
    }
});
