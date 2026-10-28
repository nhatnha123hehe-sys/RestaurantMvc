// Explicit button action: smooth easing also works when native smooth-scroll is disabled.
let frame = 0;
function stopScroll() {
  cancelAnimationFrame(frame);
  frame = 0;
  document.querySelector('#back-to-top')?.classList.remove('scrolling');
}
document.addEventListener('click', event => {
  if (!event.target.closest('[data-action="back-to-top"]')) return;
  stopScroll();
  const start = window.scrollY;
  if (start < 1) return;
  const button = document.querySelector('#back-to-top');
  button?.classList.add('scrolling');
  const duration = Math.min(1200, 650 + start * .06);
  const began = performance.now();
  const step = now => {
    const progress = Math.min((now - began) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    window.scrollTo({ top: Math.round(start * (1 - ease)), behavior: 'instant' });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stopScroll();
  };
  frame = requestAnimationFrame(step);
});
window.addEventListener('wheel', stopScroll, { passive: true });
window.addEventListener('touchstart', stopScroll, { passive: true });
window.addEventListener('keydown', event => {
  if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End','Escape',' '].includes(event.key)) stopScroll();
});
window.addEventListener('hashchange', stopScroll);
