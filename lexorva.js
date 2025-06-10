
document.addEventListener("DOMContentLoaded", function() {

  // Mode switching
  const askToggle = document.getElementById('askToggle');
  const draftToggle = document.getElementById('draftToggle');
  const askSection = document.getElementById('askSection');
  const draftSection = document.getElementById('draftSection');

  askToggle.addEventListener('click', () => {
    showAskMode();
  });

  draftToggle.addEventListener('click', () => {
    showDraftMode();
  });

  function showAskMode() {
    askToggle.classList.add('active');
    draftToggle.classList.remove('active');
    askSection.classList.remove('hidden');
    draftSection.classList.add('hidden');
  }

  function showDraftMode() {
    askToggle.classList.remove('active');
    draftToggle.classList.add('active');
    askSection.classList.add('hidden');
    draftSection.classList.remove('hidden');
    loadQuestions(); // dynamically load Guided Drafting form
  }

  // Ask Lexorva Submit
  document.getElementById('askSubmit').addEventListener('click', () => {
    const prompt = document.querySelector('.ask-input').value.trim();
    if (!prompt) return;

    document.getElementById('askResponse').innerText = "Submitting to AI...";

    fetch('/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('askResponse').innerText = data.content || 'No response from AI.';
    })
    .catch(err => {
      document.getElementById('askResponse').innerText = 'Error submitting request.';
      console.error(err);
    });
  });

  // Load Guided Drafting questions dynamically
  function loadQuestions() {
    fetch('/questions')
      .then(response => response.json())
      .then(data => {
        const questions = data.questions;
        const draftForm = document.getElementById('draftForm');
        draftForm.innerHTML = ''; // clear form first

        questions.forEach((q, index) => {
          const label = document.createElement('label');
          label.textContent = q;
          label.style.fontWeight = 'bold';
          label.style.marginTop = '12px';

          const input = document.createElement('textarea');
          input.placeholder = q;
          input.rows = 2;
          input.style.width = '100%';
          input.style.marginTop = '4px';
          input.dataset.index = index;

          draftForm.appendChild(label);
          draftForm.appendChild(input);
        });
      })
      .catch(err => console.error('Error loading questions:', err));
  }

  // Drafting Submit
  document.getElementById('draftSubmit').addEventListener('click', () => {
    const inputs = document.querySelectorAll('#draftForm textarea');
    const answers = Array.from(inputs).map(input => input.value.trim());

    if (answers.some(answer => answer === '')) {
      alert('Please answer all questions before submitting.');
      return;
    }

    document.getElementById('draftResponse').innerText = "Submitting to AI...";

    fetch('/render-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    })
    .then(response => response.json())
    .then(data => {
      const htmlContent = data.html || '<p>No response from AI.</p>';
      document.getElementById('draftResponse').innerHTML = htmlContent;
      document.getElementById('downloadPDF').disabled = false;
      // Store HTML for PDF download
      document.getElementById('downloadPDF').dataset.html = htmlContent;
    })
    .catch(err => {
      document.getElementById('draftResponse').innerText = 'Error submitting draft request.';
      console.error(err);
    });
  });

  // Download PDF
  document.getElementById('downloadPDF').addEventListener('click', () => {
    const html = document.getElementById('downloadPDF').dataset.html || '';
    if (!html) return;

    fetch('/generate-pdf-from-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'court_document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error('Error generating PDF:', err));
  });

});
