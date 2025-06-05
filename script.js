async function generateLegalDocument() {
  const prompt = document.getElementById("user-input").value;
  const format = document.getElementById("fileFormat").value;
  const responseBox = document.getElementById("response");

  if (!prompt) {
    responseBox.innerText = "⚠️ Please enter a legal prompt first.";
    return;
  }

  responseBox.innerText = "🧠 Veritas is thinking...";
  await new Promise(r => setTimeout(r, 10)); // Let UI update

  const payload = {
    prompt,
    state: "California",
    county: "Los Angeles",
    format
  };

  try {
    const res = await fetch("https://veritas-ai-backend.vercel.app/generate-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // ⚠️ Only try to read JSON here if it's NOT a file
      const errorJson = await res.json();
      responseBox.innerText = "❌ Error: " + (errorJson.message || "Unknown error.");
      return;
    }

    // ✅ This is a file, so no JSON parsing!
    const blob = await res.blob();
    const fileName =
      res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/["']/g, "") ||
      "Legal_Document";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    responseBox.innerText = "✅ Veritas finished. Document downloaded.";
  } catch (err) {
    responseBox.innerText = "❌ Network error: " + err.message;
  }
}
