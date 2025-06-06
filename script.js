// Wait for the DOM to be ready
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("veritas-form");
  const statusDiv = document.getElementById("status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Get form values
    const prompt = document.getElementById("prompt").value.trim();
    const state = document.getElementById("state").value.trim().toLowerCase();
    const county = document.getElementById("county").value.trim().toLowerCase();
    const format = "pdf"; // we only support PDF for now

    // Basic validation
    if (!prompt || !state || !county) {
      statusDiv.textContent = "\u26A0\uFE0F Please fill out all fields.";
      statusDiv.style.color = "red";
      return;
    }

    // Show loading
    statusDiv.textContent = "\u23F3 Generating document... Please wait.";
    statusDiv.style.color = "black";

    try {
      const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt, state, county, format })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error.");
      }

      // Receive PDF as blob
      const blob = await response.blob();

      // Create temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Veritas_Document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      statusDiv.textContent = "\u2705 Document generated and downloaded.";
      statusDiv.style.color = "green";

    } catch (error) {
      console.error("Error generating document:", error);
      statusDiv.textContent = `\u274C Error: ${error.message}`;
      statusDiv.style.color = "red";
    }
  });
});
