const viewer = document.querySelector('#project-viewer');
const content = document.querySelector('#viewer-content');
const title = document.querySelector('#viewer-title');
let opener;

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-gallery]');
  if (!trigger) return;
  const template = document.getElementById(`gallery-${trigger.dataset.gallery}`);
  if (!template) return;
  opener = trigger;
  title.textContent = trigger.dataset.title;
  content.replaceChildren(template.content.cloneNode(true));
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
  content.replaceChildren();
  opener?.focus({ preventScroll: true });
});
