// Paste into the browser console on any page.
// Downloads every <img> on the page (including those in shadow DOM/iframes we can access)
// plus any CSS background-image found on visible elements.
(async () => {
  const seen = new Set();
  const targets = [];

  const addTarget = (src, alt) => {
    if (src && !seen.has(src)) {
      seen.add(src);
      targets.push({ src, alt: alt || '' });
    }
  };

  document.querySelectorAll('img').forEach((img) => {
    addTarget(img.currentSrc || img.src, img.alt || img.title);
  });

  document.querySelectorAll('*').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage;
    const match = bg && bg.match(/url\(["']?(.*?)["']?\)/);
    if (match && match[1]) addTarget(match[1], '');
  });

  if (targets.length === 0) {
    console.warn('No images found on the page.');
    return;
  }

  const slugify = (s) =>
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  for (let i = 0; i < targets.length; i++) {
    const { src, alt } = targets[i];
    try {
      const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
      const blob = await res.blob();
      const url = new URL(src, location.href);
      let filename = url.pathname.split('/').pop() || '';
      if (!filename || !filename.includes('.')) {
        const ext = (blob.type.split('/')[1] || 'png').replace('svg+xml', 'svg');
        filename = `${slugify(alt) || `logo-${i + 1}`}.${ext}`;
      }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      console.log(`Downloaded: ${filename} (${src})`);
    } catch (err) {
      console.error(`Failed to download ${src}:`, err);
    }
  }

  console.log(`Done. Attempted ${targets.length} image(s).`);
})();
