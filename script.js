document.addEventListener("DOMContentLoaded", () => {
  const sendBtn = document.getElementById("sendBtn");
  const inputField = document.getElementById("userInput");
  const responseBox = document.getElementById("responseBox");
  const statusBox = document.getElementById("statusBox");
  const downloadBtn = document.getElementById("downloadBtn");

  sendBtn.addEventListener("click", async () => {
    const prompt = inputField.value.trim();
    if (!prompt) return;

    responseBox.innerHTML = "";
    statusBox.innerHTML = "📄 Drafting your document...";
    downloadBtn.style.display = "none";

    try {
      const res = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          state: "california",
          county: "los angeles",
          format: "pdf"
        }),
      });

      const blob = await res.blob();

      if (blob.type !== "application/pdf") {
        const errText = await blob.text();
        statusBox.innerHTML = "❌ Error: " + errText;
        return;
      }

      // Show preview
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.style.width = "100%";
      iframe.style.height = "600px";
      iframe.style.border = "1px solid #444";
      responseBox.appendChild(iframe);

      // Enable download
      downloadBtn.href = url;
      downloadBtn.download = "veritas_draft.pdf";
      downloadBtn.style.display = "inline-block";

      statusBox.innerHTML = "✅ Document ready";
    } catch (err) {
      statusBox.innerHTML = "❌ Failed to generate document.";
      console.error(err);
    }
  });
});
