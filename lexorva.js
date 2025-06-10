
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

function submitAsk() {
  const askInput = document.getElementById('askInput').value;
  const askResponse = document.getElementById('askResponse');
  askResponse.value = 'Processing...';

  fetch('http://localhost:5000/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: askInput })
  })
  .then(response => response.json())
  .then(data => {
    askResponse.value = data.response || 'Error processing response';
  })
  .catch(error => {
    askResponse.value = 'Error: ' + error.message;
  });
}

function submitDraft() {
  const form = document.getElementById('draftForm');
  const formData = new FormData(form);
  const answers = [
    formData.get('docType'), formData.get('state'), formData.get('county'),
    formData.get('courtName'), formData.get('parties'), formData.get('facts'),
    formData.get('issues'), formData.get('conclusion'), formData.get('signature')
  ];

  const draftResponse = document.getElementById('draftResponse');
  draftResponse.value = 'Processing...';

  fetch('http://localhost:5000/render-html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: answers })
  })
  .then(response => response.json())
  .then(data => {
    draftResponse.value = data.html || 'Error processing response';
  })
  .catch(error => {
    draftResponse.value = 'Error: ' + error.message;
  });
}

function downloadAskResponse() {
  alert('PDF download not implemented yet for Ask Lexorva.'); // Placeholder
}

function downloadDraftResponse() {
  alert('PDF download not implemented yet for Drafting.'); // Placeholder
}
