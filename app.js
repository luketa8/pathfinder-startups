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

document.querySelectorAll('.background-video').forEach(video => {
  const toggle = video.parentElement.querySelector('.video-toggle');
  const region = video.parentElement.classList.contains('hero') ? 'hero' : 'closing';
  let inView = false;
  let userPaused = false;

  function showFallback() {
    video.classList.remove('is-ready');
    toggle.hidden = true;
  }

  function updatePlayback() {
    toggle.hidden = reducedMotion.matches || !video.classList.contains('is-ready');
    if (reducedMotion.matches || !inView || document.hidden || userPaused) {
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
    toggle.hidden = false;
  });
  video.addEventListener('error', showFallback);
  toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    const action = userPaused ? 'Play' : 'Pause';
    toggle.textContent = `${action} video`;
    toggle.setAttribute('aria-label', `${action} ${region} background video`);
    updatePlayback();
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  }).observe(video.parentElement);
  reducedMotion.addEventListener('change', updatePlayback);
  document.addEventListener('visibilitychange', updatePlayback);
});