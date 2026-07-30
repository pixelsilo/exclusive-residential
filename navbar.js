  document.addEventListener("DOMContentLoaded", function() {
    // Select the elements
    const elements = document.querySelectorAll(".nav_button, .nav-link, .menu_lottie, .fs_nav, .navbar_static_background");
    
    // Track the state so we don't spam the DOM
    let isScrolled = false;

    function toggleScrolledClass() {
      const scrollPos = window.scrollY;
      const threshold = 20; // Increased slightly to stop the "flick"

      if (scrollPos > threshold && !isScrolled) {
        elements.forEach(el => el.classList.add("scrolled"));
        isScrolled = true;
      } else if (scrollPos <= threshold && isScrolled) {
        elements.forEach(el => el.classList.remove("scrolled"));
        isScrolled = false;
      }
    }

    // Run once on load
    toggleScrolledClass();

    // Listen for scroll
    window.addEventListener("scroll", toggleScrolledClass, { passive: true });
  });