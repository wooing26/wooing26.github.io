const viewer = document.querySelector('#project-viewer');
const content = document.querySelector('#viewer-content');
const title = document.querySelector('#viewer-title');
const videoPanel = document.querySelector('#viewer-video');
const mediaControls = document.querySelector('.media-switcher');
const hint = viewer.querySelector('.viewer-hint');
let opener;
let request = 0;
let activeGallery;
let downloadNavigation = false;
const galleries = new Map();

// Use the existing project video link as the single source of truth.
function findVideo(root) {
  for (const link of root.querySelectorAll('a[href]')) {
    let url;
    try {
      url = new URL(link.getAttribute('href'), document.baseURI);
    } catch {
      continue;
    }
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
    else if (['youtube.com', 'www.youtube.com'].includes(url.hostname)) {
      id = url.searchParams.get('v');
    }
    if (id && /^[\w-]{11}$/.test(id)) {
      return { id, url: `https://www.youtube.com/watch?v=${id}` };
    }
  }
}

function prepare(trigger) {
  const key = trigger.dataset.gallery;
  if (galleries.has(key)) return galleries.get(key);
  const template = document.getElementById(`gallery-${key}`);
  if (!template) return;
  const node = document.createElement('div');
  node.append(template.content.cloneNode(true));
  const video = findVideo(node);
  const images = [...node.querySelectorAll('img')];
  const ready = Promise.allSettled(images.map((image) => {
    image.loading = 'eager';
    image.decoding = 'async';
    return image.decode();
  }));
  const gallery = { node, ready, video };
  galleries.set(key, gallery);
  return gallery;
}

function stopVideo() {
  // Removing the iframe stops playback on tab changes, Escape and dialog close.
  videoPanel.replaceChildren();
}

async function selectMedia(mode) {
  const gallery = activeGallery;
  if (!gallery) return;
  const current = ++request;
  stopVideo();
  for (const button of mediaControls.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.media === mode));
  }
  const videoSelected = mode === 'video' && gallery.video;
  content.hidden = Boolean(videoSelected);
  videoPanel.hidden = !videoSelected;
  hint.hidden = Boolean(videoSelected);
  if (videoSelected) {
    const player = document.createElement('iframe');
    player.src = `https://www.youtube-nocookie.com/embed/${gallery.video.id}?playsinline=1&rel=0`;
    player.title = `${title.textContent} 플레이 영상`;
    player.allow = 'encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.className = 'project-video';
    const link = document.createElement('a');
    link.href = gallery.video.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'video-external';
    link.textContent = 'YouTube에서 보기 ↗';
    const note = document.createElement('p');
    note.className = 'video-note';
    note.append('재생이 제한되면 ', link, '를 눌러 주세요.');
    videoPanel.append(player, note);
    hint.textContent = '플레이 버튼으로 영상을 재생할 수 있습니다. 이미지는 위에서 선택해 주세요.';
    viewer.scrollTop = 0;
    return;
  }
  hint.textContent = '이미지를 불러오는 중입니다.';
  await gallery.ready;
  if (current !== request || gallery !== activeGallery) return;
  content.replaceChildren(gallery.node);
  hint.textContent = '이미지를 클릭하면 원본 크기로 열립니다. ESC로 닫기';
  viewer.scrollTop = 0;
}

// Make cards with footage recognizable before opening the viewer.
for (const trigger of document.querySelectorAll('[data-gallery]')) {
  const template = document.getElementById(`gallery-${trigger.dataset.gallery}`);
  if (!template || !findVideo(template.content)) continue;
  trigger.classList.add('has-video');
  trigger.setAttribute('aria-label', `${trigger.dataset.title} 플레이 영상 및 이미지 보기`);
  const icon = trigger.querySelector('span[aria-hidden]');
  if (icon) icon.textContent = '▶';
}

for (const eventName of ['pointerover', 'focusin']) {
  document.addEventListener(eventName, (event) => {
    const trigger = event.target.closest('[data-gallery]');
    if (trigger) prepare(trigger);
  });
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-gallery]');
  if (!trigger) return;
  const gallery = prepare(trigger);
  if (!gallery) return;
  opener = trigger;
  activeGallery = gallery;
  title.textContent = trigger.dataset.title;
  mediaControls.hidden = !gallery.video;
  content.replaceChildren();
  selectMedia(gallery.video ? 'video' : 'images');
  if (!viewer.open) viewer.showModal();
});

mediaControls.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-media]');
  if (button) selectMedia(button.dataset.media);
});

viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  const downloadLink = event.target.closest('a[href="#downloads"]');
  if (downloadLink) {
    event.preventDefault();
    downloadNavigation = true;
    viewer.close();
    return;
  }
  if (event.target !== viewer) return;
  const rect = viewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
});
viewer.addEventListener('close', () => {
  request++;
  stopVideo();
  activeGallery = undefined;
  if (downloadNavigation) {
    downloadNavigation = false;
    window.location.hash = 'downloads';
    const downloads = document.querySelector('#downloads');
    downloads.focus({ preventScroll: true });
    downloads.scrollIntoView({ block: 'start' });
    return;
  }
  opener?.focus({ preventScroll: true });
});
