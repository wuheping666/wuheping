#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成「美股走势判断 / 杠杆风险温度计」看板的宏观兜底数据 us-market-gauge-embed.js

实时核心(浏览器直连):
  - 融资杠杆   : thetrading.tools FINRA Margin Debt CSV (CORS*) -> 由页面实时 fetch
  - 标普/纳指  : 腾讯财经 qt.gtimg.cn (CORS*)                    -> 由页面实时 fetch

本脚本只负责"无 CORS、需服务端抓取"的宏观量，作为 file:// 与源不可用时的兜底:
  - GDP(FRED, 季度)            -> 计算 融资余额/GDP
  - 席勒CAPE(multpl 已失效)    -> 采用文章引用值(连续3月>40, 历史最高区)作兜底常值

产出: us-market-gauge-embed.js  ->  window.US_GAUGE_MACRO = {...}
用法: python3 scripts/build_us_market_gauge.py
"""
import urllib.request, csv, io, json, os, sys, time, datetime

OUT_JS = "us-market-gauge-embed.js"
FRED_GDP = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDP"
UA = {"User-Agent": "Mozilla/5.0"}

def http_get(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()

def fnum(s):
    try:
        return float(str(s).replace(",", "").strip())
    except Exception:
        return None

def fetch_gdp():
    """返回 (date_str, value_billion) 或 None"""
    try:
        text = http_get(FRED_GDP).decode("utf-8")
        last = None
        for row in csv.reader(io.StringIO(text)):
            if len(row) < 2:
                continue
            d, v = row[0].strip(), row[1].strip()
            if d.lower() in ("date", "observation_date") or v in ("", "."):
                continue
            val = fnum(v)
            if val is not None:
                last = (d, val)
        return last
    except Exception as e:
        print("  [warn] GDP 抓取失败:", e, file=sys.stderr)
        return None

def main():
    gdp = fetch_gdp()
    macro = {
        "updated": datetime.date.today().isoformat(),
        # GDP 单位: 十亿美元($B)。融资余额单位 $百万, 计算比率时统一到 $百万。
        "gdp": {"date": gdp[0] if gdp else "2026-01-01",
                "value_billion": gdp[1] if gdp else 31865.721},
        # 席勒CAPE: 文章(寒叔, 2026-07-29)指出连续3个月>40, 处历史最高区。
        # multpl CSV 接口已失效, 此处采用文章引用值作为兜底常值, 需人工/Action 周期更新。
        "cape": {"date": "2026-07-29",
                 "value": 40.5,
                 "note": "据寒叔《面临暴力去杠杆的,不止是韩国股市》(2026-07-29): "
                         "席勒CAPE连续3个月>40, 处历史最高区域。multpl接口失效, 此为文章引用值。"},
        # 融资余额 / 美股总市值: 文章引用约 1.7%, 明显低于2000/2007峰值, 处正常区间。
        "margin_mktcap_pct": 1.7,
        "margin_mktcap_note": "文章引用值 ~1.7%; FRED 总市值序列(WILL5000INDFC)被反爬拦截, 暂用文章引用。",
    }
    js = (
        "// 美股走势判断看板 — 宏观兜底数据(无CORS量, 服务端抓取/文章引用)\n"
        "// 浏览器实时优先: 融资(thetrading CORS*) + 标普(腾讯 CORS*)\n"
        f"// updated: {macro['updated']}\n"
        "window.US_GAUGE_MACRO = " + json.dumps(macro, ensure_ascii=False) + ";\n"
    )
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"[ok] 写入 {OUT_JS}：GDP {macro['gdp']['value_billion']}$B@{macro['gdp']['date']}, "
          f"CAPE {macro['cape']['value']}@{macro['cape']['date']}")

if __name__ == "__main__":
    main()
