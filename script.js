async function submitPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  const file = document.getElementById('file-upload').files[0];
  const status = document.getElementById('status');
  const responseContainer = document.getElementById('response-container');

  status.textContent = '⏳ Drafting your document...';
  responseContainer.innerHTML = ''; // Clear previous content

  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prompt", prompt);
      formData.append("state", "california");
      formData.append("county", "los angeles");
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
          state: "california",
          county: "los angeles",
          format: "pdf"
        }),
      });
    }

    if (!response.ok) throw new Error("Server error");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Show preview of PDF
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.width = "100%";
    iframe.height = "600px";
    iframe.style.border = "1px solid #ccc";

    // Create Download button
    const downloadButton = document.createElement("a");
    downloadButton.href = url;
    downloadButton.download = "veritas_draft.pdf";
    downloadButton.textContent = "📥 Download PDF";
    downloadButton.style.display = "inline-block";
    downloadButton.style.marginTop = "15px";
    downloadButton.style.padding = "10px 15px";
    downloadButton.style.backgroundColor = "#4CAF50";
    downloadButton.style.color = "white";
    downloadButton.style.textDecoration = "none";
    downloadButton.style.borderRadius = "5px";

    // Display in response container
    responseContainer.appendChild(iframe);
    responseContainer.appendChild(downloadButton);

    status.textContent = "✅ Document ready. Preview below.";
  } catch (error) {
    console.error(error);
    status.textContent = "❌ Error generating document.";
    responseContainer.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}
