async function generateLegalDocument() {
  const prompt = document.getElementById("legalPrompt").value;
  const statusEl = document.getElementById("veritasStatus");

  const payload = {
    prompt,
    state: "California",
    county: "Los Angeles",
    format: "docx"
  };

  try {
    // 🔵 Show thinking message
    statusEl.innerText = "🧠 Veritas is thinking...";

    const res = await fetch("https://veritas-ai-backend.vercel.app/generate-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // 🔴 Error handling
    if (!res.ok) {
      const err = await res.json();
      statusEl.innerText = "❌ Error: " + err.message;
      return;
    }

    // ✅ Success
    const blob = await res.blob();
    const fileName = res.headers
      .get("Content-Disposition")
      ?.split("filename=")[1]
      ?.replace(/["']/g, "") || "Legal_Document";

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // ✅ Clear status
    statusEl.innerText = "✅ Veritas finished. Document downloaded.";
  } catch (err) {
    statusEl.innerText = "❌ Network error: " + err.message;
  }
}
