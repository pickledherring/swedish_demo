async function includePartials() {
  const slots = document.querySelectorAll('[data-include]');
  await Promise.all(Array.from(slots).map(async (el) => {
    const res = await fetch(el.getAttribute('data-include'));
    el.outerHTML = await res.text();
  }));

  const link = document.querySelector(`.site-header [data-nav="${document.body.dataset.page}"]`);
  if (link) link.classList.add('active');
}

document.addEventListener('DOMContentLoaded', includePartials);
