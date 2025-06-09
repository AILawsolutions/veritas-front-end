async function submitPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  const file = document.getElementById('file-upload').files[0];
  const status = document.getElementById('status');
  const responseContainer = document.getElementById('response-container');

  status.textContent = '⏳ Drafting your document...';

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

    const link = document.createElement("a");
    link.href = url;
    link.download = "veritas_draft.pdf";
    link.click();

    status.textContent = "✅ Document ready and downloaded.";
    responseContainer.innerHTML = `<p><strong>Success!</strong> Your court document has been downloaded.</p>`;
  } catch (error) {
    console.error(error);
    status.textContent = "❌ Error generating document.";
    responseContainer.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
  }
}
