#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 margin-data.json 缓存快照（融资融券全市场每日汇总）。
数据源：东方财富数据中心 RPTA_RZRQ_LSHJ（每交易日一行，沪+深+北证）。
注意：带 Referer 请求时东财返回「万元」，本脚本统一转换为「元」，
与前端浏览器直连（无 Referer，返回元）的口径一致，前端再 ÷1e8 显示为亿元。
用法：python3 scripts/build_margin.py  ->  写出 margin-data.json
"""
import json, urllib.request, urllib.parse, datetime, sys

API = "https://datacenter-web.eastmoney.com/api/data/v1/get"
REPORT = "RPTA_RZRQ_LSHJ"
COLUMNS = "RZRQYE,RZYE,RQYE,RZMRE,RZCHE,RZJME,RQYL,RZRQYECZ,DIM_DATE"
# 单位说明：东方财富接口返回的数值单位随请求头（Referer / UA）变化——
# 浏览器 fetch（无 Referer）与服务端 urllib 请求均返回「元」。
# 因此本脚本直接按「元」存储，与前端浏览器直连口径一致，前端再 ÷1e8 显示为亿元。
UNIT_TO_YUAN = 1
PAGES = 2                    # 2*500=1000 行 ≈ 最近 4 年（覆盖 3Y 区间；更长历史由前端实时直连补全）
OUT = "margin-data.json"


def fetch_page(p: int):
    params = {
        "reportName": REPORT, "columns": COLUMNS, "pageSize": "500",
        "pageNumber": str(p), "sortColumns": "DIM_DATE", "sortTypes": "-1",
        "source": "WEB", "client": "WEB",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Referer": "https://data.eastmoney.com/"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    rows = {}
    for p in range(1, PAGES + 1):
        try:
            j = fetch_page(p)
        except Exception as e:
            print(f"[warn] page {p} 失败: {e}", file=sys.stderr)
            break
        if not j.get("result", {}).get("data"):
            break
        for r in j["result"]["data"]:
            d = r["DIM_DATE"][:10]
            rec = {
                "DIM_DATE": r["DIM_DATE"],
                "RZRQYE": (r.get("RZRQYE") or 0) * UNIT_TO_YUAN,
                "RZYE":   (r.get("RZYE") or 0) * UNIT_TO_YUAN,
                "RQYE":   (r.get("RQYE") or 0) * UNIT_TO_YUAN,
                "RZMRE":  (r.get("RZMRE") or 0) * UNIT_TO_YUAN,
                "RZCHE":  (r.get("RZCHE") or 0) * UNIT_TO_YUAN,
                "RZJME":  (r.get("RZJME") or 0) * UNIT_TO_YUAN,
                "RQYL":   (r.get("RQYL") or 0),
                "RZRQYECZ": (r.get("RZRQYECZ") or 0) * UNIT_TO_YUAN,
            }
            rows[d] = rec
    data = sorted(rows.values(), key=lambda x: x["DIM_DATE"])
    out = {
        "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": "eastmoney-RPTA_RZRQ_LSHJ",
        "unit": "元",
        "note": "全市场(沪+深+北证)融资融券每日汇总；前端÷1e8=亿元",
        "data": data,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"[ok] 写入 {OUT}：{len(data)} 个交易日，最新 {data[-1]['DIM_DATE'][:10]}")


if __name__ == "__main__":
    main()
