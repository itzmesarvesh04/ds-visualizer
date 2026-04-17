document.addEventListener('DOMContentLoaded', () => {
  // Page Transitions
  const links = document.querySelectorAll('a[href$=".html"], a[href^="index.html"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || link.target === '_blank') return;
      const target = link.getAttribute('href');
      if (!target || target.includes('#')) return;
      
      e.preventDefault();
      document.body.classList.add('fade-out');
      setTimeout(() => { window.location.href = target; }, 300);
    });
  });

  // Intersection Observer for Scroll Animations
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-reveal');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card, .section-header, .hero-content').forEach(el => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });

  // Simple Navbar Scroll Effect
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) nav.classList.add('navbar-scrolled');
    else nav.classList.remove('navbar-scrolled');
  });
});
