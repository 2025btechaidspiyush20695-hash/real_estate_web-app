/* ============================================================
   GURUKRIPA DIAGNOSTIC GUARD v2.3 — external file (CSP-safe)
   White screen kabhi nahi: agar JS load/run fail ho to visible
   error panel dikhta hai, exact blocked URL ke saath.
   ============================================================ */
(function () {
  window.__GURUKRIPA_VER__ = '2.3';
  var failed = [];

  window.addEventListener('error', function (e) {
    var t = e.target;
    var url = '';
    if (t && (t.src || t.href)) url = t.src || t.href;
    else url = e.filename || 'inline';
    failed.push(url + ' :: ' + (e.message || (t ? 'load blocked (' + t.tagName + ')' : '')));
  }, true);

  window.addEventListener('unhandledrejection', function (e) {
    failed.push('Promise: ' + String(e.reason || '').slice(0, 200));
  });

  function showError(title, lines) {
    var d = document.getElementById('root');
    if (d && d.innerHTML) return; // app rendered — no need
    document.title = 'Error — Gurukripa Estate';
    d = d || document.body;
    d.innerHTML =
      '<div style="min-height:100vh;display:grid;place-items:center;background:#0a352f;color:#faf5ea;font-family:Segoe UI,Arial,sans-serif;text-align:center;padding:24px">' +
      '<div style="max-width:560px">' +
      '<div style="font-size:42px">🏠</div>' +
      '<h1 style="font-size:24px;margin:14px 0 8px">' + title + '</h1>' +
      '<p style="opacity:.85;font-size:13.5px;line-height:1.7">' + lines.join('<br>') + '</p>' +
      '<div style="background:rgba(255,255,255,.09);border-radius:10px;padding:10px 14px;font-size:11.5px;word-break:break-word;margin:14px 0;text-align:left;max-height:150px;overflow:auto">' +
      (failed.length ? failed.join('<br>') : '(no error captured)') +
      '</div>' +
      '<button onclick="location.reload()" style="background:#e8730f;color:#fff;border:0;border-radius:999px;padding:12px 30px;font-weight:700;font-size:15px;cursor:pointer">Reload Page</button>' +
      '</div></div>';
  }

  setTimeout(function () {
    var d = document.getElementById('root');
    if (!d || !d.innerHTML) {
      showError('Oops! Kuch gadbad ho gayi', [
        'Website ka JavaScript load nahi ho paya.',
        'Neeche exact reason likha hai — screenshot karke bhejo.',
        '',
        'Aage badhne ke liye:',
        '1. Incognito window kholo (Ctrl+Shift+N) aur waha site kholo',
        '2. Agar Incognito me chal gayi = koi extension/ad-blocker block kar raha hai',
        '3. Extension disable karo ya start-prod.bat use karo (production mode,',
        '   ad-blocker wali problem nahi aati)',
        '4. Console me check karo: GURUKRIPA v2.3 dikhna chahiye',
      ]);
    }
  }, 6000);

  window.addEventListener('load', function () {
    console.log('%c🏠 Gurukripa Estate %cv2.3 — code loaded OK',
      'background:#0f4c43;color:#f2a43b;font-weight:bold;padding:3px 8px;border-radius:4px', 'color:#e8730f');
  });
})();
