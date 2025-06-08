document.getElementById("generateBtn").addEventListener("click", async function () {
    const prompt = document.getElementById("prompt").value.trim();
    const state = document.getElementById("state").value.trim();
    const county = document.getElementById("county").value.trim();
    const format = document.getElementById("format").value;

    if (!prompt || !state || !county) {
        alert("Please fill in all fields.");
        return;
    }

    document.getElementById("spinner").style.display = "block";
    document.getElementById("status").innerText = "Drafting your document...";
    document.getElementById("documentPreview").style.display = "none";
    document.getElementById("downloadLink").style.display = "none";

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: prompt,
                state: state,
                county: county,
                format: format
            })
        });

        if (!response.ok) throw new Error("Document generation failed.");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        document.getElementById("documentPreview").style.display = "block";
        document.getElementById("documentPreview").innerHTML = `
            <iframe src="${url}" width="100%" height="600px"></iframe>
        `;
        document.getElementById("downloadLink").href = url;
        document.getElementById("downloadLink").style.display = "inline-block";
        document.getElementById("status").innerText = "✅ Document Ready";

    } catch (error) {
        console.error(error);
        document.getElementById("status").innerText = "❌ An error occurred while generating the document.";
    } finally {
        document.getElementById("spinner").style.display = "none";
    }
});
