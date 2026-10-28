// Animate.css keyframes + native observers: no npm/build step or CDN at runtime.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const allowed = () => !preference.matches || document.documentElement.classList.contains('allow-banner-motion');
const selector = '.hero-copy > *, .feast-hero .hero-art, .signature-card, .section-top, .benefits, .menu-toolbar, .dish, .table-invitation';
const seen = new WeakSet();
const watched = new Set();
const running = new Map();
let scanFrame = 0;

function animate(element, name, delay = 0) {
  if (!element || !allowed()) return;
  running.get(element)?.();
  const clear = () => {
    element.classList.remove('motion-play');
    element.style.removeProperty('--motion-name');
    element.style.removeProperty('--motion-delay');
    running.delete(element);
    element.removeEventListener('animationend', clear);
    element.removeEventListener('animationcancel', clear);
  };
  element.style.setProperty('--motion-name', name);
  element.style.setProperty('--motion-delay', `${delay}ms`);
  element.classList.add('motion-play');
  running.set(element, clear);
  element.addEventListener('animationend', clear);
  element.addEventListener('animationcancel', clear);
}

const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    observer.unobserve(element);
    watched.delete(element);
    element.classList.remove('motion-pending');
    // Clickable cards fade without moving their hit area under the pointer.
    animate(element, element.matches('.hero-art, .dish, .signature-card, .menu-toolbar') ? 'fadeIn' : 'fadeInUp', Number(element.dataset.motionDelay || 0));
  });
}, { threshold: .08 }) : null;

function scan() {
  scanFrame = 0;
  watched.forEach(element => {
    if (!element.isConnected) { observer?.unobserve(element); watched.delete(element); }
  });
  [...running].forEach(([element, clear]) => { if (!element.isConnected) clear(); });
  document.querySelectorAll('[data-banner-motion]').forEach(button => {
    const enabled = document.documentElement.classList.contains('allow-banner-motion');
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? 'Tắt hiệu ứng chuyển động' : 'Bật hiệu ứng chuyển động';
  });
  if (!allowed() || !observer) return;
  document.querySelectorAll(selector).forEach((element, index) => {
    if (seen.has(element)) return;
    seen.add(element);
    element.dataset.motionDelay = String(Math.min(index % 4, 3) * 65);
    // Keep initial/above-screen content visible. Only prepare offscreen entrances.
    if (element.getBoundingClientRect().top >= innerHeight) element.classList.add('motion-pending');
    observer.observe(element);
    watched.add(element);
  });
}

const queueScan = () => { if (!scanFrame) scanFrame = requestAnimationFrame(scan); };
new MutationObserver(queueScan).observe(document.querySelector('#app'), { childList: true, subtree: true });
window.addEventListener('bepnha:render', queueScan);

function updatePreference() {
  if (!allowed()) {
    observer?.disconnect();
    watched.clear();
    document.querySelectorAll('.motion-pending').forEach(element => {
      element.classList.remove('motion-pending');
      seen.delete(element);
    });
    [...running.values()].forEach(clear => clear());
  }
  queueScan();
}
preference.addEventListener('change', updatePreference);
new MutationObserver(updatePreference).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// A cart pulse reflects a successful quantity change, not merely a click.
let cartCount = Number(document.querySelector('.cart-count')?.textContent || 0);
new MutationObserver(() => {
  const next = Number(document.querySelector('.cart-count')?.textContent || 0);
  if (next > cartCount) animate(document.querySelector('.cart-btn'), 'pulse');
  cartCount = next;
}).observe(document.querySelector('#account'), { childList: true, subtree: true, characterData: true });

const dialog = document.querySelector('#dialog');
new MutationObserver(records => {
  if (records.some(record => record.attributeName === 'open' || record.type === 'childList')) {
    if (dialog.open) animate(dialog, 'zoomIn');
    else running.get(dialog)?.();
  }
}).observe(dialog, { attributes: true, attributeFilter: ['open'], childList: true });

document.addEventListener('pointerdown', event => {
  const button = event.target.closest('.btn, .add-btn, .filters button, .motion-choice');
  if (!button || button.disabled || !allowed() || event.button !== 0) return;
  const bounds = button.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'button-ripple';
  ripple.setAttribute('aria-hidden', 'true');
  const size = Math.max(bounds.width, bounds.height) * 2;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - bounds.left - size / 2}px`;
  ripple.style.top = `${event.clientY - bounds.top - size / 2}px`;
  button.classList.add('ripple-host');
  button.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  setTimeout(() => ripple.remove(), 800);
});

scan();
