
function toggleMode(mode) {
    const askBtn = document.getElementById('askToggle');
    const draftBtn = document.getElementById('draftToggle');
    const askSec = document.getElementById('askSection');
    const draftSec = document.getElementById('draftSection');

    if (mode === 'ask') {
        askBtn.classList.add('active');
        draftBtn.classList.remove('active');
        askSec.classList.remove('hidden');
        draftSec.classList.add('hidden');
    } else {
        askBtn.classList.remove('active');
        draftBtn.classList.add('active');
        askSec.classList.add('hidden');
        draftSec.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle Ask Lexorva file upload preview
    const uploadAskInput = document.getElementById('uploadAskFile');
    uploadAskInput.addEventListener('change', function() {
        const fileName = uploadAskInput.files[0] ? uploadAskInput.files[0].name : '';
        console.log('Selected Ask file:', fileName);
    });

    // Handle Drafting file upload preview
    const uploadDraftInput = document.getElementById('uploadDraftFile');
    uploadDraftInput.addEventListener('change', function() {
        const fileName = uploadDraftInput.files[0] ? uploadDraftInput.files[0].name : '';
        console.log('Selected Draft file:', fileName);
    });

    // Dummy Ask Submit
    document.getElementById('askSubmit').addEventListener('click', function() {
        const input = document.getElementById('askInput').value;
        document.getElementById('askResponse').value = `LEXORVA is processing your question: "${input}"...\n(Mock response)`;
    });

    // Dummy Draft Submit
    document.getElementById('draftSubmit').addEventListener('click', function() {
        document.getElementById('draftResponse').value = 'LEXORVA is generating your drafted document...\n(Mock response)';
    });

    // Dummy Download PDF
    document.getElementById('downloadDraftPDF').addEventListener('click', function() {
        alert('Download PDF functionality triggered (connect to backend).');
    });
});
