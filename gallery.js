const viewer = document.querySelector('#project-viewer');
const content = document.querySelector('#viewer-content');
const title = document.querySelector('#viewer-title');
let opener;
let request = 0;
const galleries = new Map();

function prepare(trigger) {
  const key = trigger.dataset.gallery;
  if (galleries.has(key)) return galleries.get(key);
  const template = document.getElementById(`gallery-${key}`);
  if (!template) return;
  const node = document.createElement('div');
  node.append(template.content.cloneNode(true));
  const images = [...node.querySelectorAll('img')];
  const ready = Promise.allSettled(images.map((image) => {
    image.loading = 'eager';
    image.decoding = 'async';
    return image.decode();
  }));
  const gallery = { node, ready };
  galleries.set(key, gallery);
  return gallery;
}

for (const eventName of ['pointerover', 'focusin']) {
  document.addEventListener(eventName, (event) => {
    const trigger = event.target.closest('[data-gallery]');
    if (trigger) prepare(trigger);
  });
}

document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-gallery]');
  if (!trigger) return;
  const gallery = prepare(trigger);
  if (!gallery) return;
  const current = ++request;
  trigger.setAttribute('aria-busy', 'true');
  await gallery.ready;
  trigger.removeAttribute('aria-busy');
  if (current !== request) return;
  opener = trigger;
  title.textContent = trigger.dataset.title;
  content.replaceChildren(gallery.node);
  viewer.showModal();
});

viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (event) => {
  if (event.target !== viewer) return;
  const rect = viewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
});
viewer.addEventListener('close', () => {
  request++;
  opener?.focus({ preventScroll: true });
});
