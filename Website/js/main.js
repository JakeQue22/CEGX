/* ============================================================
   CEGX Procurement – Main JavaScript
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM Ready ---------- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNav();
    initScrollReveal();
    initCounters();
    initCarousel();
    initContactForm();
    initCategoryTabs();
    highlightActiveNav();
  }

  /* =====================
     Navigation
     ===================== */
  function initNav() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    // Scroll shrink
    function onScroll() {
      if (window.scrollY > 60) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('open');
        links.classList.toggle('open');
      });

      // Close on link click
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          toggle.classList.remove('open');
          links.classList.remove('open');
        });
      });
    }
  }

  /* =====================
     Active nav highlighting
     ===================== */
  function highlightActiveNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  /* =====================
     Scroll Reveal (Intersection Observer)
     ===================== */
  function initScrollReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* =====================
     Animated Counters
     ===================== */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out quad
      var eased = 1 - (1 - progress) * (1 - progress);
      var current = Math.floor(eased * target);
      el.textContent = prefix + current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toLocaleString() + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  /* =====================
     Carousel
     ===================== */
  function initCarousel() {
    var carousel = document.querySelector('.carousel');
    if (!carousel) return;

    var track = carousel.querySelector('.carousel-track');
    var prevBtn = carousel.querySelector('.carousel-btn--prev');
    var nextBtn = carousel.querySelector('.carousel-btn--next');
    if (!track || !prevBtn || !nextBtn) return;

    var index = 0;
    var cards = track.children;

    function getCardWidth() {
      if (!cards.length) return 0;
      var style = getComputedStyle(track);
      var gap = parseInt(style.gap) || 28;
      return cards[0].offsetWidth + gap;
    }

    function maxIndex() {
      var visible = Math.floor(carousel.offsetWidth / getCardWidth()) || 1;
      return Math.max(0, cards.length - visible);
    }

    function slide() {
      track.style.transform = 'translateX(-' + (index * getCardWidth()) + 'px)';
    }

    nextBtn.addEventListener('click', function () {
      index = Math.min(index + 1, maxIndex());
      slide();
    });

    prevBtn.addEventListener('click', function () {
      index = Math.max(index - 1, 0);
      slide();
    });
  }

  /* =====================
     Contact Form Validation
     ===================== */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      // Clear previous errors
      form.querySelectorAll('.form-group').forEach(function (g) {
        g.classList.remove('error');
      });

      // Required fields
      form.querySelectorAll('[required]').forEach(function (input) {
        if (!input.value.trim()) {
          valid = false;
          input.closest('.form-group').classList.add('error');
        }
      });

      // Email pattern
      var email = form.querySelector('[type="email"]');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        valid = false;
        email.closest('.form-group').classList.add('error');
        var errEl = email.closest('.form-group').querySelector('.form-error');
        if (errEl) errEl.textContent = 'Please enter a valid email address.';
      }

      if (valid) {
        form.style.display = 'none';
        var success = document.querySelector('.form-success');
        if (success) success.classList.add('show');
      }
    });
  }

  /* =====================
     Category Tabs (Government page)
     ===================== */
  function initCategoryTabs() {
    var tabs = document.querySelectorAll('.category-tab');
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var cat = this.getAttribute('data-category');

        tabs.forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');

        document.querySelectorAll('.framework-card').forEach(function (card) {
          if (cat === 'all' || card.getAttribute('data-category') === cat) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

})();
