async function generateDocument() {
    const prompt = document.getElementById("prompt").value;
    const state = document.getElementById("state").value;
    const county = document.getElementById("county").value;
    const format = document.getElementById("format").value;

    document.getElementById("status").innerText = "⏳ Generating document...";

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, state, county, format })
        });

        if (format === "pdf") {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "document.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            document.getElementById("status").innerText = "✅ Document generated (PDF downloaded)";
        } else {
            const data = await response.json();
            document.getElementById("output").innerText = data.document || data.message;
            document.getElementById("status").innerText = "✅ Document generated";
        }
    } catch (error) {
        console.error(error);
        document.getElementById("status").innerText = "❌ Error generating document";
    }
}
