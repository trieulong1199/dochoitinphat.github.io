/* Happy Pickleball Club — Giải Đồng Đội 09/2026 */
(function () {
  'use strict';

  /* --- Menu mobile ---------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕' : '☰';
    });

    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = '☰';
      }
    });
  }

  /* --- Đếm ngược tới hạn chốt đăng ký ---------------------------------- */
  var box = document.getElementById('countdown');
  var grid = document.getElementById('countdownGrid');
  if (!box || !grid) return;

  var deadline = new Date(box.getAttribute('data-deadline')).getTime();
  if (isNaN(deadline)) return;

  var UNITS = [
    { key: 'd', label: 'Ngày' },
    { key: 'h', label: 'Giờ' },
    { key: 'm', label: 'Phút' },
    { key: 's', label: 'Giây' }
  ];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function render() {
    var left = deadline - Date.now();

    if (left <= 0) {
      box.querySelector('.countdown-label').textContent = 'Đăng ký';
      grid.innerHTML = '<div class="countdown-done">⏳ Đã hết hạn đăng ký — vui lòng liên hệ Ban tổ chức.</div>';
      return false;
    }

    var s = Math.floor(left / 1000);
    var value = {
      d: Math.floor(s / 86400),
      h: Math.floor(s / 3600) % 24,
      m: Math.floor(s / 60) % 60,
      s: s % 60
    };

    grid.innerHTML = UNITS.map(function (u) {
      return '<div class="cd-cell">' +
             '<div class="cd-num">' + pad(value[u.key]) + '</div>' +
             '<div class="cd-unit">' + u.label + '</div>' +
             '</div>';
    }).join('');

    return true;
  }

  if (render()) {
    var timer = setInterval(function () {
      if (!render()) clearInterval(timer);
    }, 1000);
  }
})();
