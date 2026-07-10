async function includePartials() {
  const slots = document.querySelectorAll('[data-include]');
  await Promise.all(Array.from(slots).map(async (el) => {
    const res = await fetch(el.getAttribute('data-include'));
    el.outerHTML = await res.text();
  }));

  // highlight the current page in the nav
  const link = document.querySelector(`.site-nav [data-nav="${document.body.dataset.page}"]`);
  if (link) link.classList.add('active');

  // mobile hamburger
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
}

document.addEventListener('DOMContentLoaded', includePartials);
