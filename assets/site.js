/* 博客通用串联：在非首页注入「🏠 财务自由之路」悬浮按钮（返回博客首页），
   并为缺少页脚的浅色文章页自动补一个统一博客页脚。 */
(function () {
  var p = location.pathname.split('/').pop();
  if (p === 'index.html' || p === '') return;

  // —— 悬浮返回按钮 ——
  var btn = document.createElement('a');
  btn.href = 'index.html';
  btn.textContent = '🏠 财务自由之路';
  btn.setAttribute('aria-label', '返回博客首页');
  btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;text-decoration:none;'
    + 'background:linear-gradient(135deg,#b8860b,#9a6a10);color:#fff;'
    + 'font:600 13.5px/1 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;'
    + 'padding:10px 15px;border-radius:22px;box-shadow:0 4px 16px rgba(120,90,0,.35);'
    + 'transition:transform .15s;';
  btn.onmouseenter = function () { btn.style.transform = 'translateY(-2px)'; };
  btn.onmouseleave = function () { btn.style.transform = 'none'; };
  document.body.appendChild(btn);

  // —— 统一页脚（仅浅色主题且尚无 footer 的页面）——
  function isLight(rgb) {
    var m = (rgb || '').match(/\d+/g);
    if (!m) return true; // 无法解析时默认浅色，保守处理
    var r = +m[0], g = +m[1], b = +m[2];
    // 相对亮度
    var lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.5;
  }
  if (!document.querySelector('footer')) {
    var bg = getComputedStyle(document.body).backgroundColor;
    if (isLight(bg)) {
      var f = document.createElement('footer');
      f.style.cssText = 'text-align:center;color:#5b6577;font-size:12.5px;'
        + 'margin-top:46px;line-height:1.9;padding:22px 18px 40px';
      f.innerHTML = '⚠️ 本站内容均为投资理财常识与公开资料整理，内置计算器为理论演示，'
        + '<b style="color:#5b4a12">不构成任何投资建议</b>。谨慎决策，对自己负责。<br>'
        + '财务自由之路 · 个人博客 &nbsp;|&nbsp; '
        + '<a href="index.html" style="color:#9a6a10;text-decoration:none;font-weight:700">← 返回博客首页</a>';
      document.body.appendChild(f);
    }
  }
})();
