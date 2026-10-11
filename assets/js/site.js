/* Céline · 个人视觉档案 —— 页面交互 */
(function () {
  'use strict';

  var doc = document;

  /* ---------------- 吸顶 header ---------------- */
  var header = doc.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------- 移动端菜单 ---------------- */
  var menuBtn = doc.querySelector('.menu-btn');
  var drawer = doc.querySelector('.nav-drawer');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------------- 滚动出现动画 ---------------- */
  var reveals = doc.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------- 分类筛选 ---------------- */
  var filters = doc.querySelectorAll('.filter');
  var memories = Array.prototype.slice.call(doc.querySelectorAll('.memory'));
  if (filters.length && memories.length) {
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        memories.forEach(function (m) {
          var show = cat === 'all' || m.getAttribute('data-cat') === cat;
          m.classList.toggle('is-hidden', !show);
          m.setAttribute('aria-hidden', show ? 'false' : 'true');
        });
        var empty = doc.querySelector('[data-filter-empty]');
        if (empty) {
          var visible = memories.filter(function (m) { return !m.classList.contains('is-hidden'); }).length;
          empty.hidden = visible > 0;
        }
      });
    });
  }

  /* ---------------- 回到顶部 & 锚点 ---------------- */
  doc.querySelectorAll('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      var target = doc.querySelector(el.getAttribute('data-scroll-to'));
      if (target) { ev.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ---------------- 灯箱 ---------------- */
  var lb = null;
  var lbList = [];
  var lbIndex = 0;

  function buildLightbox() {
    lb = doc.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '媒体预览');
    lb.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="关闭">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4"/></svg></button>' +
      '<button class="lightbox__btn lightbox__btn--prev" type="button" aria-label="上一张">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5 7.5 12l7 7"/></svg></button>' +
      '<div class="lightbox__stage"><div class="lightbox__media"></div><div class="lightbox__cap"></div></div>' +
      '<button class="lightbox__btn lightbox__btn--next" type="button" aria-label="下一张">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5l7 7-7 7"/></svg></button>';
    doc.body.appendChild(lb);

    lb.querySelector('.lightbox__close').addEventListener('click', closeLb);
    lb.querySelector('.lightbox__btn--prev').addEventListener('click', function () { stepLb(-1); });
    lb.querySelector('.lightbox__btn--next').addEventListener('click', function () { stepLb(1); });
    lb.addEventListener('click', function (ev) {
      if (ev.target === lb) closeLb();
    });
  }

  function renderLb() {
    var item = lbList[lbIndex];
    if (!item) return;
    var media = lb.querySelector('.lightbox__media');
    var cap = lb.querySelector('.lightbox__cap');
    media.innerHTML = '';
    if (item.type === 'video') {
      var v = doc.createElement('video');
      v.src = item.video;
      v.poster = item.full;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      media.appendChild(v);
    } else {
      var img = doc.createElement('img');
      img.src = item.full;
      img.alt = item.title || '';
      media.appendChild(img);
    }
    cap.innerHTML = '';
    if (doc.body.getAttribute('data-lightbox-caption') === 'off') return;
    var t = doc.createElement('span');
    t.textContent = item.title || '';
    cap.appendChild(t);
    var d = doc.createElement('span');
    d.className = 'date';
    d.textContent = [item.date, item.cat].filter(Boolean).join('  ·  ');
    cap.appendChild(d);
  }

  function stepLb(delta) {
    if (!lbList.length) return;
    lbIndex = (lbIndex + delta + lbList.length) % lbList.length;
    renderLb();
  }

  function openLb(index) {
    if (!lb) buildLightbox();
    lbIndex = index;
    renderLb();
    lb.classList.add('is-open');
    doc.body.classList.add('no-scroll');
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove('is-open');
    var v = lb.querySelector('video');
    if (v) v.pause();
    lb.querySelector('.lightbox__media').innerHTML = '';
    doc.body.classList.remove('no-scroll');
  }

  doc.addEventListener('click', function (ev) {
    var link = ev.target.closest ? ev.target.closest('[data-lb]') : null;
    if (!link) return;
    ev.preventDefault();
    var visible = memories.filter(function (m) { return !m.classList.contains('is-hidden'); });
    if (!visible.length) return;
    lbList = visible.map(function (m) {
      return {
        type: m.getAttribute('data-type') || 'photo',
        full: m.getAttribute('data-full'),
        video: m.getAttribute('data-video') || '',
        title: m.getAttribute('data-title') || '',
        date: m.getAttribute('data-date') || '',
        cat: m.getAttribute('data-cat-label') || ''
      };
    });
    openLb(visible.indexOf(link));
  });

  doc.addEventListener('keydown', function (ev) {
    if (lb && lb.classList.contains('is-open')) {
      if (ev.key === 'Escape') { closeLb(); ev.preventDefault(); }
      else if (ev.key === 'ArrowLeft') { stepLb(-1); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight') { stepLb(1); ev.preventDefault(); }
      return;
    }
    if (searchOverlay && searchOverlay.classList.contains('is-open') && ev.key === 'Escape') {
      closeSearch();
    }
  });

  /* ---------------- 搜索 ---------------- */
  var searchOverlay = doc.querySelector('.search-overlay');
  var searchInput = searchOverlay ? searchOverlay.querySelector('input') : null;
  var searchResults = searchOverlay ? searchOverlay.querySelector('.search-results') : null;
  var searchIndex = null;
  var searchLoading = false;

  function loadIndex() {
    if (searchIndex || searchLoading) return;
    searchLoading = true;
    fetch('assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { searchIndex = data; runSearch(); })
      .catch(function () { searchIndex = []; runSearch(); });
  }

  function siteBase() {
    var m = doc.querySelector('meta[name="site-base"]');
    return m ? m.getAttribute('content') : '';
  }

  function runSearch() {
    if (!searchResults) return;
    var q = (searchInput.value || '').trim().toLowerCase();
    if (!searchIndex) { searchResults.innerHTML = '<p class="search-hint">载入中…</p>'; return; }
    var list = q
      ? searchIndex.filter(function (it) {
          return (it.t + ' ' + it.c + ' ' + (it.d || '') + ' ' + (it.z || '')).toLowerCase().indexOf(q) !== -1;
        })
      : searchIndex.slice(0, 12);
    if (!list.length) {
      searchResults.innerHTML = '<p class="search-hint">没有找到「' + escapeHtml(q) + '」相关的内容。</p>';
      return;
    }
    searchResults.innerHTML = list.slice(0, 60).map(function (it) {
      return '<a href="' + siteBase() + it.u + '">' +
        '<img src="' + (it.i ? siteBase() + it.i : '') + '" alt="" loading="lazy" width="64" height="48">' +
        '<span class="t">' + escapeHtml(it.t) + (it.e ? '<span style="display:block;font-style:italic;font-size:12px;color:var(--muted)">' + escapeHtml(it.e) + '</span>' : '') + '</span>' +
        '<span class="m">' + escapeHtml(it.c) + (it.d ? ' · ' + escapeHtml(it.d) : '') + '</span>' +
        '</a>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    doc.body.classList.add('no-scroll');
    loadIndex();
    setTimeout(function () { searchInput.focus(); }, 30);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
    doc.body.classList.remove('no-scroll');
  }

  doc.querySelectorAll('[data-open-search]').forEach(function (b) {
    b.addEventListener('click', openSearch);
  });
  if (searchOverlay) {
    searchOverlay.querySelector('[data-close-search]').addEventListener('click', closeSearch);
    var form = searchOverlay.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
    searchInput.addEventListener('input', runSearch);
    searchOverlay.addEventListener('click', function (ev) { if (ev.target === searchOverlay) closeSearch(); });
  }
})();
