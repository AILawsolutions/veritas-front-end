function startLoadingAnimation(element) {
  let dots = 0;
  element.innerHTML = '<span class="typewriter">⏳ Veritas is generating your legal document</span>';
  const interval = setInterval(() => {
    dots = (dots + 1) % 4;
    let trail = ".".repeat(dots) + "&nbsp;".repeat(3 - dots);
    element.querySelector(".typewriter").innerHTML = `⏳ Veritas is generating your legal document${trail}`;
  }, 500);
  return interval;
}

function applyGlowingEffect(element) {
  element.style.backgroundColor = "#0f0";
  element.style.color = "#000";
  element.style.fontWeight = "bold";
  element.style.boxShadow = "0 0 20px #0f0, 0 0 30px #0f0";
  element.style.border = "none";
  element.style.padding = "12px 24px";
  element.style.borderRadius = "8px";
  element.style.cursor = "pointer";
}

async function sendMessage() {
  const prompt = document.getElementById("user-input").value.trim();
  const responseDiv = document.getElementById("response");

  if (!prompt) {
    responseDiv.innerHTML = "⚠️ Please enter a legal prompt.";
    return;
  }

  const loading = startLoadingAnimation(responseDiv);

  try {
    const payload = {
      answers: [
        "Motion to Compel Discovery",
        "California",
        "Los Angeles",
        "Los Angeles Superior Court",
        "Jane Smith (Plaintiff) vs. Acme Corp (Defendant)",
        "Defendant failed to provide discovery documents despite multiple requests.",
        "Failure to comply with discovery obligations under California Civil Procedure",
        "Compel defendant to produce all responsive documents and pay attorney's fees.",
        "Jane Smith, LegalForce LLP, 123 Justice Lane, LA, CA, 90001, (123) 456-7890"
      ]
    };

    const res = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-legal-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    clearInterval(loading);

    if (!res.ok) throw new Error("Server error");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Veritas_Document.pdf";
    applyGlowingEffect(a);
    a.textContent = "⬇️ Download Your Legal Document";
    document.body.appendChild(a);

    responseDiv.innerHTML = "✅ Your legal document is ready!";
  } catch (err) {
    clearInterval(loading);
    responseDiv.innerHTML = "❌ Error: " + err.message;
  }
}
