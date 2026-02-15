(() => {
  const nav = document.querySelector("[data-top-nav]");
  const fadeTargets = document.querySelectorAll(".fade-section");
  const currentPage = document.body?.dataset?.page || "";

  const updateNavState = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 50);
  };

  document.querySelectorAll("[data-page-target]").forEach((link) => {
    if (link.dataset.pageTarget === currentPage) {
      link.classList.add("is-active");
    }
  });

  updateNavState();
  window.addEventListener("scroll", updateNavState, { passive: true });

  if (!("IntersectionObserver" in window)) {
    fadeTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  fadeTargets.forEach((el) => observer.observe(el));
})();
