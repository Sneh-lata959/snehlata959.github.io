(function () {
  'use strict';
  var root = document.querySelector('.travel-landing');
  if (!root) return;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduce ? 'auto' : 'smooth';

  /* Footer year */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Mobile menu */
  var nav = root.querySelector('.nav');
  var burger = root.querySelector('.burger');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); }
  });

  /* Smooth in-page links (offset handled by scroll-margin-top in CSS) */
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: behavior, block: 'start' });
    if (history.pushState) history.pushState(null, '', '#' + id);
  }
  root.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (!id) { a.addEventListener('click', function (e) { e.preventDefault(); }); return; } /* placeholder links */
    a.addEventListener('click', function (e) {
      e.preventDefault();
      setMenu(false);
      scrollToId(id);
    });
  });

  /* Package buttons preselect the package in the form */
  var pkgSelect = document.getElementById('package');
  root.querySelectorAll('[data-package]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-package');
      for (var i = 0; i < pkgSelect.options.length; i++) {
        if (pkgSelect.options[i].text === val) { pkgSelect.selectedIndex = i; break; }
      }
    });
  });

  /* Entrance animation */
  var items = root.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Portfolio slider (no autoplay) */
  var track = document.getElementById('track');
  var dots = document.querySelectorAll('#dots button');
  function current() { return Math.round(track.scrollLeft / track.clientWidth); }
  function go(n) {
    n = (n + dots.length) % dots.length;
    track.scrollTo({ left: n * track.clientWidth, behavior: behavior });
  }
  document.getElementById('prev').addEventListener('click', function () { go(current() - 1); });
  document.getElementById('next').addEventListener('click', function () { go(current() + 1); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
  track.addEventListener('scroll', function () {
    var c = current();
    dots.forEach(function (d, i) { d.setAttribute('aria-current', i === c ? 'true' : 'false'); });
  }, { passive: true });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
  });

  /* Enquiry form */
  var form = document.getElementById('enquiry-form');
  var submitBtn = document.getElementById('submit');
  var statusEl = document.getElementById('status');
  var submitting = false;
  var BTN_LABEL = submitBtn.textContent;

  var rules = {
    full_name: 'Please enter your full name.',
    business_name: 'Please enter your travel agency or business name.',
    email: 'Please enter a valid work email address.',
    whatsapp: 'Please enter your WhatsApp number with country code, for example +91 98765 43210.',
    requirements: 'Please tell me a little about your project.',
    consent: 'Please tick the box so I can contact you about your enquiry.'
  };

  function field(name) { return form.elements[name]; }

  function setError(name, msg) {
    var el = field(name), id = 'err-' + name;
    var existing = document.getElementById(id);
    if (!msg) {
      if (existing) existing.remove();
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
      return;
    }
    if (!existing) {
      existing = document.createElement('small');
      existing.className = 'err';
      existing.id = id;
      var host = el.closest('label') || el.parentNode;
      host.appendChild(existing);
    }
    existing.textContent = msg;
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', id);
  }

  function check(name) {
    var el = field(name), v = (el.type === 'checkbox' ? el.checked : el.value.trim());
    var msg = '';
    if (!v) msg = rules[name];
    else if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = rules.email;
    else if (name === 'whatsapp' && !/^\+\d[\d\s().-]{7,18}$/.test(v)) msg = rules.whatsapp;
    setError(name, msg);
    return !msg;
  }

  var optionalUrl = field('existing_website');
  function checkUrl() {
    var v = optionalUrl.value.trim(), ok = true;
    if (v) { try { var u = new URL(v); ok = /^https?:$/.test(u.protocol); } catch (e) { ok = false; } }
    var id = 'err-existing_website', ex = document.getElementById(id);
    if (ok) { if (ex) ex.remove(); optionalUrl.removeAttribute('aria-invalid'); optionalUrl.removeAttribute('aria-describedby'); return true; }
    if (!ex) { ex = document.createElement('small'); ex.className = 'err'; ex.id = id; optionalUrl.closest('label').appendChild(ex); }
    ex.textContent = 'Please enter a full web address starting with https://';
    optionalUrl.setAttribute('aria-invalid', 'true'); optionalUrl.setAttribute('aria-describedby', id);
    return false;
  }

  Object.keys(rules).forEach(function (name) {
    var el = field(name);
    el.addEventListener('blur', function () { check(name); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) check(name); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid')) check(name); });
  });
  optionalUrl.addEventListener('blur', checkUrl);

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;

    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      if (!check(name) && !firstBad) firstBad = field(name);
    });
    if (!checkUrl() && !firstBad) firstBad = optionalUrl;
    if (firstBad) {
      setStatus('Please fix the highlighted fields and try again.', 'bad');
      firstBad.focus();
      return;
    }

    /* Honeypot: silently drop bot submissions */
    if (field('_gotcha').value) return;

    var data = new FormData(form);
    var feats = data.getAll('required_features');
    data.delete('required_features');
    data.set('required_features', feats.length ? feats.join(', ') : 'None selected');
    data.set('submitted_at', new Date().toISOString());
    data.set('page_url', window.location.href);

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('Sending your enquiry…', '');

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        setStatus('Thank you. Your enquiry has been sent. I’ll review it and reply to you personally.', 'ok');
      } else {
        return res.json().catch(function () { return {}; }).then(function (body) {
          var detail = body && body.errors && body.errors[0] && body.errors[0].message;
          setStatus('Sorry, your enquiry could not be sent' + (detail ? ' (' + detail + ')' : '') + '. Please try again in a moment.', 'bad');
        });
      }
    }).catch(function () {
      setStatus('Sorry, your enquiry could not be sent. Please check your connection and try again.', 'bad');
    }).then(function () {
      submitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = BTN_LABEL;
    });
  });
})();
