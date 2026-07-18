/* 系列通用导航：在非首页文章右下角注入「📑 目录」浮动按钮，返回 index.html */
(function () {
  var p = location.pathname.split('/').pop();
  if (p === 'index.html' || p === '') return;
  var btn = document.createElement('a');
  btn.href = 'index.html';
  btn.textContent = '📑 目录';
  btn.setAttribute('aria-label', '返回系列目录');
  btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;text-decoration:none;'
    + 'background:linear-gradient(135deg,#b8860b,#9a6a10);color:#fff;'
    + 'font:600 13.5px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;'
    + 'padding:10px 15px;border-radius:22px;box-shadow:0 4px 16px rgba(120,90,0,.35);'
    + 'transition:transform .15s;';
  btn.onmouseenter = function () { btn.style.transform = 'translateY(-2px)'; };
  btn.onmouseleave = function () { btn.style.transform = 'none'; };
  document.body.appendChild(btn);
})();
