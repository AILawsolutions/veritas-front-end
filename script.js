
async function sendMessage() {
  const input = document.getElementById("user-input").value;
  const file = document.getElementById("fileInput").files[0];
  const responseBox = document.getElementById("response");

  responseBox.innerText = "⏳ Processing...";

  let response;
  if (file) {
    const formData = new FormData();
    formData.append("file", file);
    response = await fetch("https://ailawsolutions.pythonanywhere.com/analyze-upload", {
      method: "POST",
      body: formData
    });
  } else {
    response = await fetch("https://ailawsolutions.pythonanywhere.com/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    });
  }

  const result = await response.json();
  responseBox.innerText = result.summary || result.message || "⚠️ No response received.";
}

document.getElementById("fileInput").addEventListener("change", function(e) {
  const name = e.target.files[0] ? e.target.files[0].name : "";
  document.getElementById("file-name").innerText = name;
});

async function generateLegalDocument() {
  const prompt = document.getElementById("user-input").value;
  const format = document.getElementById("fileFormat").value;
  const responseBox = document.getElementById("response");

  if (!prompt) {
    responseBox.innerText = "⚠️ Please enter a legal prompt first.";
    return;
  }

  responseBox.innerText = "🧠 Veritas is thinking...";

  const payload = {
    prompt,
    state: "California",
    county: "Los Angeles",
    format
  };

  try {
    const res = await fetch("https://veritas-ai-backend.vercel.app/generate-document", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      responseBox.innerText = "❌ Error: " + err.message;
      return;
    }

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

    responseBox.innerText = "✅ Veritas finished. Document downloaded.";
  } catch (err) {
    responseBox.innerText = "❌ Network error: " + err.message;
  }
}
