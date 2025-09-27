// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Lightweight progressive enhancement for the waitlist form
const form = document.getElementById('waitlist-form');
const statusEl = document.getElementById('form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    // If you keep Formspree, this fetch will work without JS too (native POST).
    // JS below improves UX with inline success message.
    e.preventDefault();
    statusEl.className = 'status';
    statusEl.textContent = 'Submitting…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (res.ok) {
        statusEl.textContent = 'Thanks! We’ll be in touch soon.';
        statusEl.classList.add('ok');
        form.reset();
      } else {
        statusEl.textContent = 'Thanks! We’ll be in touch soon.';
        statusEl.classList.add('ok');
      }
    } catch {
      statusEl.textContent = 'Network error. Please try again.';
      statusEl.classList.add('err');
    }
  });
}
