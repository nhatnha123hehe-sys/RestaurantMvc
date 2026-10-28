// Delegation keeps effects working after menu/filter content is rendered again.
const bannerSelector = '.feast-hero .hero-art, .signature-card, .table-invitation, .dish-art';
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activeBanner = null;
let frame = 0;
let pending = null;
const motionAllowed = () => !reducedMotion.matches || document.documentElement.classList.contains('allow-banner-motion');

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-banner-motion]');
  if (!toggle) return;
  const enabled = document.documentElement.classList.toggle('allow-banner-motion');
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.textContent = enabled ? 'Tắt hiệu ứng chuyển động' : 'Bật hiệu ứng chuyển động';
  resetBanner();
});

function resetBanner() {
  cancelAnimationFrame(frame);
  frame = 0;
  pending = null;
  if (!activeBanner) return;
  activeBanner.classList.remove('pointer-lit');
  ['--pointer-x', '--pointer-y', '--photo-x', '--photo-y'].forEach(name => activeBanner.style.removeProperty(name));
  activeBanner = null;
}

document.addEventListener('pointermove', event => {
  if (!finePointer.matches || !motionAllowed() || document.querySelector('dialog[open]')) {
    resetBanner();
    return;
  }
  const banner = event.target.closest(bannerSelector);
  if (banner !== activeBanner) {
    resetBanner();
    activeBanner = banner;
  }
  if (!banner) return;
  pending = { x: event.clientX, y: event.clientY };
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!activeBanner?.isConnected || !pending) return;
    const bounds = activeBanner.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.max(0, Math.min(1, (pending.x - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (pending.y - bounds.top) / bounds.height));
    activeBanner.style.setProperty('--pointer-x', `${x * 100}%`);
    activeBanner.style.setProperty('--pointer-y', `${y * 100}%`);
    activeBanner.style.setProperty('--photo-x', `${(x - .5) * 10}px`);
    activeBanner.style.setProperty('--photo-y', `${(y - .5) * 10}px`);
    activeBanner.classList.add('pointer-lit');
  });
}, { passive: true });

document.addEventListener('pointerout', event => { if (!event.relatedTarget) resetBanner(); });
window.addEventListener('blur', resetBanner);
window.addEventListener('hashchange', resetBanner);
finePointer.addEventListener('change', resetBanner);
reducedMotion.addEventListener('change', resetBanner);
