
async function sendMessage() {
  const input = document.getElementById("user-input").value;
  const chatBox = document.getElementById("chat-box");

  chatBox.innerHTML += `\nYou: ${input}`;
  document.getElementById("user-input").value = "";

  const response = await fetch("https://ailawsolutions.pythonanywhere.com/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input })
  });

  const result = await response.json();
  chatBox.innerHTML += `\nVeritas: ${result.message || "No response received."}`;
  chatBox.scrollTop = chatBox.scrollHeight;
}
