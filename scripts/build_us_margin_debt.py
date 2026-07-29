#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成美股融资杠杆(Margin Debt)看板的兜底数据 us-margin-debt-embed.js
数据源：thetrading.tools 的 FINRA Margin Debt CSV（直连 CORS*，浏览器实时优先）
       该 CSV 字段: date, debit_balances, debit_yoy, spy_yoy,
                     excess_leverage, free_credit_cash, free_credit_margin, added_date
       数据来源 FINRA Rule 4521(d) 月度披露，历史自 1997 起，单位 $百万。
产出：us-margin-debt-embed.js  ->  window.US_MARGIN_DEBT = [...]  (全量兜底)
用法：python3 scripts/build_us_margin_debt.py
"""
import urllib.request, csv, io, json, os, sys, time

CSV_URL = "https://www.thetrading.tools/data/indicators/margin-debt.csv"
OUT_JS = "us-margin-debt-embed.js"

PROXIES = {}
for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    if os.environ.get(k):
        PROXIES["http"] = os.environ[k]
        PROXIES["https"] = os.environ[k]
        break

UA = {"User-Agent": "Mozilla/5.0", "Origin": "https://wuheping.top"}

def http_get(url, retries=4):
    last = None
    for _ in range(retries):
        # 1) 直连（本地/CI 直连 thetrading.tools 可用）
        try:
            req = urllib.request.Request(url, headers=UA)
            raw = urllib.request.urlopen(req, timeout=25).read()
            if raw:
                return raw
        except Exception as e:
            last = e
        # 2) 代理
        if PROXIES:
            try:
                req = urllib.request.Request(url, headers=UA)
                opener = urllib.request.build_opener(urllib.request.ProxyHandler(PROXIES))
                raw = opener.open(req, timeout=25).read()
                if raw:
                    return raw
            except Exception as e:
                last = e
        time.sleep(1.5)
    raise last or RuntimeError("http_get failed: " + url)

def fnum(s):
    try:
        return float(s) if s not in (None, "", "nan") else None
    except Exception:
        return None

def main():
    text = http_get(CSV_URL).decode("utf-8")
    rows = []
    for row in csv.DictReader(io.StringIO(text)):
        rec = {
            "date": row.get("date", "").strip(),
            "debit": fnum(row.get("debit_balances")),
            "debit_yoy": fnum(row.get("debit_yoy")),
            "spy_yoy": fnum(row.get("spy_yoy")),
            "excess": fnum(row.get("excess_leverage")),
            "fc_cash": fnum(row.get("free_credit_cash")),
            "fc_margin": fnum(row.get("free_credit_margin")),
        }
        if not rec["date"] or rec["debit"] is None:
            continue
        rows.append(rec)
    rows.sort(key=lambda x: x["date"])
    latest = rows[-1]["date"] if rows else ""
    js = (
        "// 美股融资杠杆(Margin Debt)兜底数据 — 构建时抓取 thetrading.tools / FINRA Rule 4521(d)\n"
        f"// updated: {latest}  |  浏览器实时 fetch 优先，本文件用于 file:// 打开与源不可用时回退\n"
        f"// 单位: 融资余额/自由信用 $百万(USD millions)\n"
        "window.US_MARGIN_DEBT = " + json.dumps(rows, ensure_ascii=False) + ";\n"
    )
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"[ok] 写入 {OUT_JS}：{len(rows)} 条月度数据，最新 {latest}")

if __name__ == "__main__":
    main()
