async function submitPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  const file = document.getElementById('file-upload').files[0];
  const status = document.getElementById('status');
  const responseContainer = document.getElementById('response-container');

  status.textContent = '⏳ Drafting your document...';
  responseContainer.innerHTML = '';

  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);
      formData.append("state", "california"); // You can change this dynamically
      formData.append("county", "los angeles"); // You can change this dynamically
      formData.append("format", "pdf");

      response = await fetch("https://AiLawSolutions.pythonanywhere.com/analyze-upload", {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch("https://AiLawSolutions.pythonanywhere.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          state: "california", // You can change this dynamically
          county: "los angeles", // You can change this dynamically
          format: "pdf"
        }),
      });
    }

    if (!response.ok) throw new Error("Server error");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Show PDF preview in iframe
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = "100%";
    iframe.height = "600px";
    iframe.style.border = "1px solid #ccc";
    iframe.style.marginTop = "15px";

    // Create Download button
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download PDF";
    downloadBtn.style.marginTop = "10px";
    downloadBtn.style.padding = "10px 20px";
    downloadBtn.style.fontSize = "16px";
    downloadBtn.style.cursor = "pointer";
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = url;
      link.download = "veritas_draft.pdf";
      link.click();
    };

    // Update status and container
    status.textContent = "✅ Document ready. Preview below.";
    responseContainer.appendChild(iframe);
    responseContainer.appendChild(downloadBtn);

  } catch (error) {
    console.error(error);
    status.textContent = "❌ Error generating document.";
    responseContainer.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}
