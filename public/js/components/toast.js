function showToast(message, type = 'success', durationMs = 3000) {
  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' error' : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => el.remove(), 300);
  }, durationMs);
}
window.showToast = showToast;
