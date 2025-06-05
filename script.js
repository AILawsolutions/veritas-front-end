
async function generateLegalDocument() {
  const payload = {
    prompt: "Draft a Motion to Compel Discovery",
    state: "California",
    county: "Los Angeles",
    format: "docx"  // Change to 'pdf' if needed
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
      alert("Error: " + err.message);
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

  } catch (err) {
    alert("Network error: " + err.message);
  }
}

document.getElementById("fileInput").addEventListener("change", function(e) {
  const name = e.target.files[0] ? e.target.files[0].name : "";
  document.getElementById("file-name").innerText = name;
});
