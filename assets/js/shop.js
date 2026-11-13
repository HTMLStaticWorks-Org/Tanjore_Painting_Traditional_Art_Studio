document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     Product Filtering (Shop Page)
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  // Scoped to the main grid — the New Arrivals rail carries product cards too
  // and must never be hidden by a filter.
  const productCards = document.querySelectorAll('#collection-grid .product-card, #product-list .product-card');
  const emptyState = document.querySelector('.empty-state');

  const scrollToCollection = () => {
    const col = document.getElementById('collection');
    if (col) {
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 74;
      const top = col.getBoundingClientRect().top + window.pageYOffset - navH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  };

  const applyFilter = (filterGender, filterOccasion, filterCat) => {
    let visible = 0;

    productCards.forEach(card => {
      const cardGender = card.getAttribute('data-gender');
      const cardOccasion = card.getAttribute('data-occasion');
      const cardCat = card.getAttribute('data-category');

      let show = true;
      const target = filterCat || filterGender || filterOccasion || 'all';

      if (target !== 'all') {
        const matches = (cardCat && cardCat === target) ||
                        (cardGender && cardGender === target) ||
                        (cardOccasion && cardOccasion === target);
        if (!matches) show = false;
      }

      card.style.display = show ? 'flex' : 'none';
      if (show) visible += 1;
    });

    if (emptyState) emptyState.hidden = visible !== 0;
  };

  const markActive = (btn) => {
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    }
  };

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        markActive(btn);
        const cat = btn.getAttribute('data-category') || btn.getAttribute('data-gender') || 'all';
        applyFilter(btn.getAttribute('data-gender'), btn.getAttribute('data-occasion'), cat);
        scrollToCollection();
      });
    });

    // Honour ?category=, ?gender=, ?occasion=, ?theme= and URL hash links
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category') || params.get('theme') || params.get('gender') || params.get('occasion');
    const hash = window.location.hash ? window.location.hash.replace('#', '') : null;
    const targetKey = (categoryParam || hash || '').toLowerCase();

    if (targetKey) {
      let matchedBtn = null;
      filterBtns.forEach(b => {
        const c = (b.getAttribute('data-category') || b.getAttribute('data-gender') || '').toLowerCase();
        if (c && (c === targetKey || (targetKey === 'deities' && c === 'krishna') || (targetKey === 'sacred' && c === 'lakshmi') || (targetKey === 'goldleaf' && c === 'custom'))) {
          matchedBtn = b;
        }
      });

      if (matchedBtn) {
        markActive(matchedBtn);
        const cat = matchedBtn.getAttribute('data-category') || matchedBtn.getAttribute('data-gender') || 'all';
        applyFilter(matchedBtn.getAttribute('data-gender'), matchedBtn.getAttribute('data-occasion'), cat);
        setTimeout(scrollToCollection, 250);
      }
    }
  }

  /* ==========================================================================
     New Arrivals rail — arrow paging
     ========================================================================== */
  const rail = document.querySelector('.rail');
  if (rail) {
    const prevBtn = document.querySelector('.rail-btn[data-dir="prev"]');
    const nextBtn = document.querySelector('.rail-btn[data-dir="next"]');

    const step = () => {
      const card = rail.querySelector('.product-card');
      if (!card) return rail.clientWidth;
      const gap = parseFloat(getComputedStyle(rail).columnGap) || 32;
      return card.getBoundingClientRect().width + gap;
    };

    const syncArrows = () => {
      if (!prevBtn || !nextBtn) return;
      const max = rail.scrollWidth - rail.clientWidth;
      // In RTL, scrollLeft runs negative — compare on magnitude.
      const pos = Math.abs(rail.scrollLeft);
      prevBtn.disabled = pos <= 4;
      nextBtn.disabled = pos >= max - 4;
    };

    const page = (dir) => {
      const rtl = document.documentElement.getAttribute('dir') === 'rtl';
      rail.scrollBy({ left: step() * dir * (rtl ? -1 : 1), behavior: 'smooth' });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => page(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => page(1));
    rail.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    syncArrows();
  }

  /* ==========================================================================
     Seasonal sale countdown
     ========================================================================== */
  const clock = document.querySelector('[data-countdown]');
  if (clock) {
    let targetAttr = clock.getAttribute('data-countdown');
    let target = new Date(targetAttr).getTime();

    // If date is invalid or in the past, dynamically set target to upcoming Sunday 23:59:59
    if (isNaN(target) || target <= Date.now()) {
      const now = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
      target = nextSunday.getTime();
    }

    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
    const parts = {
      days: clock.querySelector('[data-unit="days"]'),
      hours: clock.querySelector('[data-unit="hours"]'),
      minutes: clock.querySelector('[data-unit="minutes"]'),
      seconds: clock.querySelector('[data-unit="seconds"]')
    };

    let timer = null;
    const tick = () => {
      let diff = target - Date.now();
      if (diff <= 0) {
        target += 7 * 24 * 60 * 60 * 1000;
        diff = target - Date.now();
      }
      diff = Math.floor(diff / 1000);
      if (parts.days) parts.days.textContent = pad(Math.floor(diff / 86400));
      if (parts.hours) parts.hours.textContent = pad(Math.floor(diff / 3600) % 24);
      if (parts.minutes) parts.minutes.textContent = pad(Math.floor(diff / 60) % 60);
      if (parts.seconds) parts.seconds.textContent = pad(diff % 60);
    };

    tick();
    timer = setInterval(tick, 1000);
  }

  /* ==========================================================================
     Copy the promo code out of the sale banner
     ========================================================================== */
  document.querySelectorAll('.promo-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code') || '';
      const done = () => {
        if (window.Aura) window.Aura.toast('Code ' + code + ' copied', 'ph-copy');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(done);
      } else {
        done();
      }
    });
  });

  /* ==========================================================================
     Size Guide Modal
     ========================================================================== */
  const sizeGuideBtns = document.querySelectorAll('.size-guide-btn');
  const modalOverlay = document.querySelector('.modal-overlay');
  const modalClose = document.querySelector('.modal-close');
  const modalBody = document.querySelector('.modal-body');
  let lastFocused = null;

  const measureNote = `<p style="font-size:var(--text-small); color:var(--color-text-muted); margin-top:var(--space-3)">
      All Tanjore paintings are handcrafted on seasoned jackfruit or marine-ply boards with pure 24K gold leaf, natural mineral pigments, and uncut Jaipur stones.
    </p>`;

  const sizeTables = {
    sizes: `
      <span class="eyebrow">Studio Specifications</span>
      <h3 id="modal-title">Tanjore Painting — Dimensions &amp; Frame Guide</h3>
      <table>
        <thead><tr><th>Format</th><th>Inner Artwork</th><th>With Teak Frame</th><th>Recommended Space</th></tr></thead>
        <tbody>
          <tr><td>Pooja Miniature</td><td>12 &times; 15 in</td><td>16 &times; 19 in</td><td>Home Altar / Study</td></tr>
          <tr><td>Classic Heritage</td><td>18 &times; 24 in</td><td>24 &times; 30 in</td><td>Living Room / Foyer</td></tr>
          <tr><td>Grand Temple</td><td>24 &times; 36 in</td><td>30 &times; 42 in</td><td>Main Sanctuary / Hall</td></tr>
          <tr><td>Royal Darbar</td><td>36 &times; 48 in</td><td>44 &times; 56 in</td><td>Courtyard / Estate</td></tr>
        </tbody>
      </table>${measureNote}
    `,
    frames: `
      <span class="eyebrow">Traditional Joinery</span>
      <h3 id="modal-title">Chettinad &amp; Mani Frame Options</h3>
      <table>
        <thead><tr><th>Frame Style</th><th>Timber</th><th>Finish</th></tr></thead>
        <tbody>
          <tr><td>Classic Mani Frame</td><td>Seasoned Burma Teak</td><td>Hand-Rubbed Satin Rosewood</td></tr>
          <tr><td>Carved Chettinad Arch</td><td>Aged Teakwood</td><td>Deep Antique Walnut</td></tr>
          <tr><td>Temple Gold Bevel</td><td>Teak &amp; Brass Inlay</td><td>Antique Gold Patina</td></tr>
        </tbody>
      </table>${measureNote}
    `,
    craft: `
      <span class="eyebrow">Authentic Materials</span>
      <h3 id="modal-title">Gold Leaf &amp; Gemstone Detailing</h3>
      <table>
        <thead><tr><th>Element</th><th>Traditional Material</th><th>Craft Duration</th></tr></thead>
        <tbody>
          <tr><td>Gold Gilding</td><td>24K Pure Thanjavur Gold Foil</td><td>7–10 Days</td></tr>
          <tr><td>Embossing (Sukkan)</td><td>Chalk Powder &amp; Gum Arabic</td><td>5–7 Days</td></tr>
          <tr><td>Gemstone Setting</td><td>Uncut Jaipur Kundan &amp; Pearls</td><td>3–5 Days</td></tr>
        </tbody>
      </table>${measureNote}
    `
  };

  const openSizeGuide = (type) => {
    if (!modalOverlay || !modalBody) return;

    lastFocused = document.activeElement;
    modalBody.innerHTML = sizeTables[type] || sizeTables.sizes;
    modalOverlay.classList.add('open');
    if (modalClose) modalClose.focus();
    document.body.style.overflow = 'hidden';
  };

  const closeSizeGuide = () => {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  };

  sizeGuideBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSizeGuide(btn.getAttribute('data-garment-type') || 'tops');
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeSizeGuide);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeSizeGuide();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeSizeGuide();
    }
  });

  /* ==========================================================================
     Keep focus inside the open modal
     ========================================================================== */
  if (modalOverlay) {
    modalOverlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !modalOverlay.classList.contains('open')) return;
      const focusable = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

});
