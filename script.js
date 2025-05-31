
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
