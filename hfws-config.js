window.HPEHF_CFG = {
  mainNav: {
    micrositeLogoArea: {
      micrositeTitle: 'Pathfinder',
      logo: { type: 'hpe', href: '#top', title: 'Pathfinder', ariaLabel: 'HPE Pathfinder home', dataAnalyticsRegionId: 'gmenu|Pathfinder' }
    },
    navLinks: [
      { title: 'Programs', href: '#programs', newWindow: false, dataAnalyticsRegionId: 'gmenu|Pathfinder|Programs' },
      { title: 'Why HPE', href: '#why-hpe', newWindow: false, dataAnalyticsRegionId: 'gmenu|Pathfinder|Why HPE' },
      { title: 'Companies', href: '#companies', newWindow: false, dataAnalyticsRegionId: 'gmenu|Pathfinder|Companies' },
      { title: 'About', href: '#about', newWindow: false, dataAnalyticsRegionId: 'gmenu|Pathfinder|About' }
    ],
    CTA: { title: 'Connect with HPE', href: 'mailto:pathfinder@hpe.com', newWindow: false, dataAnalyticsRegionId: 'gmenu|Pathfinder|Connect with HPE' }
  }
};

document.addEventListener('HPEHF.READY', () => {
  const header = document.querySelector('#hpehf-header');
  const toggle = header.querySelector('a[data-target-id="hpehf-mobile-nav"]');
  const mobileNav = header.querySelector('#hpehf-mobile-nav');
  const close = header.querySelector('.hpehf-srch-menu-close');
  window.HPEHF.mobileHeaderBreakPoint = 1100;
  for (const navigation of [header.querySelector('.hpehf-nav-menu'), mobileNav]) {
    navigation.setAttribute('role', 'navigation');
    navigation.setAttribute('aria-label', 'Main navigation');
  }
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-controls', mobileNav.id);
  function updateToggle() {
    const open = mobileNav.classList.contains('hpehf-active');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open && document.activeElement === toggle) {
      mobileNav.querySelector('a[href]').focus({ preventScroll: true });
    } else if (!open && document.activeElement === close) {
      toggle.focus({ preventScroll: true });
    }
  }
  new MutationObserver(updateToggle).observe(mobileNav, { attributes: true, attributeFilter: ['class'] });
  updateToggle();
  toggle.addEventListener('keydown', event => {
    if (event.key === ' ') {
      event.preventDefault();
      toggle.click();
    }
  });
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a[href]')) window.HPEHF.commonHeaderCloseFlyouts();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileNav.classList.contains('hpehf-active')) {
      window.HPEHF.commonHeaderCloseFlyouts();
      toggle.focus();
    }
  }, true);
}, { once: true });
