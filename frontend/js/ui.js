function mostrarToast(mensaje, tipo = 'info') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'ok' ? 'ok' : tipo === 'err' ? 'err' : ''}`;
  toast.textContent = mensaje;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3800);
}

function formatoMoneda(valor) {
  return `$${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}