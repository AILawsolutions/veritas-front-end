// ✅ FINAL Lexorva.js with Persistent File Memory + Faster Typewriter Speed
// (Only changes: robust fetch + correct parsing of Flask { ok, data } envelope)

document.addEventListener("DOMContentLoaded", () => {
    const chatInput = document.getElementById("chatInput");
    // ✅ Auto-resize chat input like ChatGPT
    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto"; // reset height
        chatInput.style.height = chatInput.scrollHeight + "px"; // set new height
    });
    const sendButton = document.getElementById("sendButton");
    const chatHistory = document.getElementById("chatHistory");
    const fileUploadInput = document.getElementById("fileUpload");

    const BACKEND_URL = "https://api.lexorva.pro";

    // --- ADDED: Hard-pin /api calls to production backend (no other changes needed) ---
    (() => {
      const ABS_ORIGIN = "https://api.lexorva.pro";   // your Flask backend
      const origFetch = window.fetch.bind(window);

      window.fetch = function (input, init) {
        try {
          let url = typeof input === "string" ? input : (input && input.url) || "";

          // Rewrite ONLY relative /api/* calls → https://api.lexorva.pro/*
          if (url.startsWith("/api/")) {
            url = ABS_ORIGIN + url.replace(/^\/api/, "");
            if (typeof input === "string") {
              input = url;
            } else {
              // Rebuild Request with new URL, preserving options
              input = new Request(url, input);
            }

            // Ensure proper CORS defaults
            init = init || {};
            if (!("mode" in init)) init.mode = "cors";
            if (!("credentials" in init)) init.credentials = "omit";
          }
        } catch (e) {
          // fall through on any error and use original fetch
        }
        return origFetch(input, init);
      };
    })();

    let uploadedFile = null;
    let storedFile = null;

    // ---------- helpers (NEW) ----------
    async function postJSON(path, body) {
        const res = await fetch(`${BACKEND_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body || {})
        });
        const raw = await res.text(); // be resilient to non-JSON
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch {}
        if (!res.ok) {
            const msg = (json && json.errors && json.errors[0]?.message) || raw || `HTTP ${res.status}`;
            throw new Error(msg);
        }
        return json ?? { raw };
    }

    function extractContent(payload) {
        // Accept either bare object or Flask envelope { ok, data: {...} }
        const d = (payload && (payload.data ?? payload)) || {};
        // Try common fields in order
        return (
            d.result ||
            d.response ||
            d.markdown ||
            (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) ||
            (typeof d === "string" ? d : "")
        );
    }
    // -----------------------------------

    // Show file bubble when uploaded
    fileUploadInput.addEventListener("change", () => {
        const file = fileUploadInput.files[0];
        if (!file) return;

        uploadedFile = file;
        storedFile = file;

        const fileBubble = document.createElement("div");
        fileBubble.classList.add("user-message");
        fileBubble.innerHTML = `📄 Uploaded: <strong>${file.name}</strong>`;
        chatHistory.appendChild(fileBubble);
        smoothScrollToBottom();
    });

    // Press Enter to send
    chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendButton.click();
        }
    });

    sendButton.addEventListener("click", async () => {
        const message = chatInput.value.trim();
        if (!message && !uploadedFile && !storedFile) return;

        if (message) appendMessage("user", message);
        chatInput.value = "";

        const thinkingDiv = appendMessage("ai", "Thinking<span class='dots'></span>");
        startThinkingDots(thinkingDiv);

        try {
            let responseText;

            if (uploadedFile || storedFile) {
                // keep upload behavior exactly as-is
                const formData = new FormData();
                formData.append("file", uploadedFile || storedFile);
                formData.append("prompt", message);

                const res = await fetch(`${BACKEND_URL}/upload`, {
                    method: "POST",
                    body: formData
                });
                const raw = await res.text();
                let json = null;
                try { json = raw ? JSON.parse(raw) : null; } catch {}
                if (!res.ok) {
                    const msg = (json && json.errors && json.errors[0]?.message) || raw || `HTTP ${res.status}`;
                    throw new Error(msg);
                }
                const payload = json ?? { raw };
                const d = payload.data ?? payload;
                responseText = d.result || d.response || "Document received. You may now ask questions about it.";

                uploadedFile = null;
                fileUploadInput.value = "";
            } else {
                // ✅ fixed: use helper + correct envelope parsing
                const payload = await postJSON("/proxy", { prompt: message });
                responseText = extractContent(payload) || "⚠️ Unexpected response from Lexorva.";
            }

            stopThinkingDots(thinkingDiv);
            typeMessage(thinkingDiv, marked.parse(responseText));
            showDownloadButton(responseText);

        } catch (error) {
            stopThinkingDots(thinkingDiv);
            const msg = (error && error.message) ? error.message : "Could not connect to Lexorva backend.";
            typeMessage(thinkingDiv, `❌ Error: ${msg}`);
            // also log full error for debugging
            try { console.error("[Lexorva] fetch error:", error); } catch {}
        }
    });

    function appendMessage(sender, text) {
        const msg = document.createElement("div");
        msg.className = sender === "user" ? "user-message" : "ai-message";
        msg.innerHTML = text;
        chatHistory.appendChild(msg);
        smoothScrollToBottom();
        return msg;
    }

    function smoothScrollToBottom() {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: "smooth" });
    }

    function typeMessage(element, htmlContent) {
        element.innerHTML = "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        let index = 0;

        function typeChar() {
            if (index < text.length) {
                element.innerHTML += text.charAt(index);
                index++;
                smoothScrollToBottom();
                setTimeout(typeChar, 1); // 🟢 MUCH FASTER — ChatGPT speed
            } else {
                element.innerHTML = htmlContent;
                smoothScrollToBottom();
            }
        }

        typeChar();
    }

    let thinkingInterval;
    function startThinkingDots(element) {
        let dotCount = 0;
        thinkingInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            element.innerHTML = "Thinking" + ".".repeat(dotCount);
            smoothScrollToBottom();
        }, 500);
    }

    function stopThinkingDots(element) {
        clearInterval(thinkingInterval);
        element.innerHTML = "";
    }

    function showDownloadButton(textContent) {
        const button = document.createElement("button");
        button.textContent = "⬇ Download Report";
        button.style.cssText = `
            display: block;
            margin: 12px auto 24px auto;
            padding: 6px 14px;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            cursor: pointer;
        `;
        button.onclick = () => {
            const blob = new Blob([textContent], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Lexorva_Strategy_Report_${new Date().toISOString().split("T")[0]}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        };
        chatHistory.appendChild(button);
        smoothScrollToBottom();
    }
});

// 📥 Download Report Button Logic (unchanged)
function addDownloadButtonIfEligible(responseText) {
    const responseLower = responseText.toLowerCase();
    const isMultiPart = responseText.length > 600 || responseLower.includes("strategy") || responseLower.includes("legal plan") || responseLower.includes("recommended actions");

    if (!isMultiPart) return;

    const existingButton = document.getElementById("downloadReportButton");
    if (existingButton) existingButton.remove();

    const downloadButton = document.createElement("button");
    downloadButton.id = "downloadReportButton";
    downloadButton.textContent = "Download Report";
    downloadButton.style.cssText = `
        background-color: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        padding: 6px 14px;
        margin-top: 10px;
        margin-left: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-block;
    `;

    const messageBubbles = document.querySelectorAll('.ai-response');
    const lastBubble = messageBubbles[messageBubbles.length - 1];
    if (lastBubble) lastBubble.appendChild(downloadButton);

    downloadButton.onclick = () => {
        const content = responseText;
        const doc = new window.jspdf.jsPDF();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `Lexorva_Strategy_Report_${timestamp}.pdf`;

        const lines = doc.splitTextToSize(content, 180);
        doc.setFont("times", "normal");
        doc.setFontSize(12);
        doc.text(lines, 15, 20);
        doc.save(filename);
    };
}
