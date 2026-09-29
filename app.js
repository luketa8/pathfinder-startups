const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const menuIcon = menuToggle.querySelector('img');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('is-open');
  menuIcon.src = 'assets/menu.svg';
}

menuToggle.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuToggle.setAttribute('aria-label', isExpanded ? 'Open navigation' : 'Close navigation');
  navigation.classList.toggle('is-open', !isExpanded);
  menuIcon.src = isExpanded ? 'assets/menu.svg' : 'assets/close.svg';
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const bioModal = document.querySelector('#bio-modal');
const bioClose = bioModal.querySelector('.bio-modal-close');
const bioContent = bioModal.querySelector('.bio-modal-content');

document.querySelectorAll('.bio-link').forEach(button => {
  button.addEventListener('click', () => {
    const card = button.closest('.team-card');
    const portrait = card.querySelector('img');
    const biography = card.querySelector('.team-bio');
    bioModal.querySelector('.bio-modal-portrait').src = portrait.src;
    bioModal.querySelector('.bio-modal-role').textContent = biography.dataset.role;
    bioModal.querySelector('#bio-modal-name').textContent = card.querySelector('h3').textContent;
    bioModal.querySelector('.bio-modal-text').replaceChildren(biography.content.cloneNode(true));
    bioModal.showModal();
    document.documentElement.classList.add('bio-modal-open');
    bioContent.scrollTop = 0;
    bioClose.focus();
  });
});

bioClose.addEventListener('click', () => bioModal.close());
let bioPointerStartedOutside = false;

function isOutsideBioModal(event) {
  const bounds = bioModal.getBoundingClientRect();
  return event.target === bioModal && (
    event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom
  );
}

bioModal.addEventListener('pointerdown', event => {
  bioPointerStartedOutside = isOutsideBioModal(event);
});
bioModal.addEventListener('click', event => {
  if (bioPointerStartedOutside && isOutsideBioModal(event)) bioModal.close();
  bioPointerStartedOutside = false;
});
bioModal.addEventListener('close', () => {
  // A queued close event can arrive after another biography has opened.
  if (bioModal.open) return;
  document.documentElement.classList.remove('bio-modal-open');
});
bioModal.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...bioModal.querySelectorAll('button, a[href], [tabindex="0"]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelectorAll('.background-video').forEach(video => {
  let inView = false;

  function showFallback() {
    video.classList.remove('is-ready');
  }

  function updatePlayback() {
    if (reducedMotion.matches || !inView || document.hidden) {
      video.pause();
      return;
    }
    if (!video.hasAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    video.play().catch(error => {
      if (error.name !== 'AbortError') showFallback();
    });
  }

  video.addEventListener('playing', () => {
    if (reducedMotion.matches) {
      updatePlayback();
      return;
    }
    video.classList.add('is-ready');
  });
  video.addEventListener('error', showFallback);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  }).observe(video.parentElement);
  reducedMotion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
});

const companyTrack = document.querySelector('#company-track');
const prevCompanyButton = document.querySelector('.carousel-arrow[data-direction="prev"]');
const nextCompanyButton = document.querySelector('.carousel-arrow[data-direction="next"]');

if (companyTrack && prevCompanyButton && nextCompanyButton) {
  function updateCarouselButtons() {
    const maxScroll = companyTrack.scrollWidth - companyTrack.clientWidth;
    const trackStyle = getComputedStyle(companyTrack);
    const startOffset = parseFloat(trackStyle.paddingLeft);
    const endOffset = parseFloat(trackStyle.paddingRight);
    prevCompanyButton.setAttribute('aria-disabled', String(companyTrack.scrollLeft <= startOffset + 1));
    nextCompanyButton.setAttribute('aria-disabled', String(companyTrack.scrollLeft >= maxScroll - endOffset - 1));
  }

  prevCompanyButton.addEventListener('click', () => {
    if (prevCompanyButton.getAttribute('aria-disabled') === 'true') return;
    companyTrack.scrollBy({ left: -companyTrack.clientWidth * 0.9, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    updateCarouselButtons();
  });
  nextCompanyButton.addEventListener('click', () => {
    if (nextCompanyButton.getAttribute('aria-disabled') === 'true') return;
    companyTrack.scrollBy({ left: companyTrack.clientWidth * 0.9, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    updateCarouselButtons();
  });
  companyTrack.addEventListener('scroll', updateCarouselButtons);
  new ResizeObserver(updateCarouselButtons).observe(companyTrack);
  updateCarouselButtons();
}