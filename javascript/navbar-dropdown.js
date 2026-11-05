(function(){
  const DROPDOWN_SELECTOR = '.navbar .has-dropdown';
  const HIDE_DELAY = 200; // ms: giảm nhẹ để đóng nhanh hơn
  const updateNavBottom = () => {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    const top = rect.bottom + window.scrollY;
    document.documentElement.style.setProperty('--nav-bottom', `${top}px`);
  };

  // Initialize and keep updated on resize/scroll
  updateNavBottom();
  window.addEventListener('resize', updateNavBottom);
  window.addEventListener('scroll', updateNavBottom, { passive: true });

  const items = document.querySelectorAll(DROPDOWN_SELECTOR);
  items.forEach(li => {
    const menu = li.querySelector('.mega-menu');
    if (!menu) return;

    let hideTimer = null;

    const open = () => {
      li.classList.add('open');
    };
    const scheduleClose = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!li.matches(':hover') && !menu.matches(':hover')) {
          li.classList.remove('open');
        }
      }, HIDE_DELAY);
    };

    li.addEventListener('mouseenter', open);
    li.addEventListener('mouseleave', scheduleClose);

    menu.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      open();
    });
    menu.addEventListener('mouseleave', scheduleClose);
  });
})();
