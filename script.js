async function submitPrompt() {
    const answers = [];

    document.querySelectorAll(".guided-question").forEach((input) => {
        answers.push(input.value.trim());
    });

    const status = document.getElementById('status');
    const previewContainer = document.getElementById('preview-container');
    const downloadButton = document.getElementById('download-btn');

    status.textContent = '⏳ Drafting your document...';

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/render-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers }),
        });

        if (!response.ok) throw new Error("Server error");

        const result = await response.json();

        previewContainer.innerHTML = result.html;
        previewContainer.contentEditable = true;
        previewContainer.style.border = "2px solid #ccc";
        previewContainer.style.padding = "20px";
        previewContainer.style.marginTop = "20px";
        previewContainer.style.backgroundColor = "#fff";
        previewContainer.style.fontFamily = "Times New Roman, serif";
        previewContainer.style.lineHeight = "2";

        status.textContent = "✅ Document ready. You can edit it below.";
        downloadButton.disabled = false;
    } catch (error) {
        console.error(error);
        status.textContent = "❌ Error generating document.";
    }
}

async function downloadPDF() {
    const previewContainer = document.getElementById('preview-container');
    const status = document.getElementById('status');

    status.textContent = '⏳ Generating PDF...';

    try {
        const response = await fetch("https://AiLawSolutions.pythonanywhere.com/generate-pdf-from-html", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: previewContainer.innerHTML }),
        });

        if (!response.ok) throw new Error("Server error");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "veritas_final_draft.pdf";
        link.click();

        status.textContent = "✅ PDF downloaded.";
    } catch (error) {
        console.error(error);
        status.textContent = "❌ Error generating PDF.";
    }
}
