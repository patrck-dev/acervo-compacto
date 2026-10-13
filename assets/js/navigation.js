/** Navegação nativa por âncoras com marcação da seção observada. */
export function initNavigation(sections) {
  const links = [...document.querySelectorAll('.toc-list a[href^="#"]')];
  function setCurrent(sectionId) {
    links.forEach(link => {
      if (link.hash === `#${sectionId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  let latest = sections[0]?.id;
  const update = () => {
    const threshold = window.innerHeight * .34;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) latest = section.id;
    }
    if (latest) setCurrent(latest);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  links.forEach(link => link.addEventListener('click', () => {
    setCurrent(link.hash.slice(1));
    document.querySelector('.mobile-toc[open]')?.removeAttribute('open');
  }));
  update();
  return { update };
}
