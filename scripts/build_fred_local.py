#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性构建：用本地 FRED CSV（/tmp/fred_*.csv）+ 已有内嵌 BLS 数据，产出新版 embed/json。
（BLS 当日限流时用已有内嵌 BLS；FRED 用 curl 直连落盘的文件，规避 urllib SSL 问题。）"""
import json, re, csv, datetime, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FRED_DIR = os.path.join(base, "scripts")

def read_fred(path):
    out = {}
    with open(path, encoding="utf-8") as f:
        rdr = csv.reader(f); next(rdr, None)
        for r in rdr:
            if len(r) < 2 or not r[1].strip():
                continue
            try:
                d = datetime.datetime.strptime(r[0], "%Y-%m-%d").strftime("%Y-%m")
                if d < "2014-01":
                    continue
                out[d] = float(r[1])
            except Exception:
                pass
    return out

fred = {
    "PCE":   read_fred(os.path.join(FRED_DIR, "fred_PCEPI.csv")),
    "PCEL":  read_fred(os.path.join(FRED_DIR, "fred_PCEPILFE.csv")),
    "FED":   read_fred(os.path.join(FRED_DIR, "fred_FEDFUNDS.csv")),
    "DGS10": read_fred(os.path.join(FRED_DIR, "fred_DGS10.csv")),
    "DGS20": read_fred(os.path.join(FRED_DIR, "fred_DGS20.csv")),
    "DGS30": read_fred(os.path.join(FRED_DIR, "fred_DGS30.csv")),
    "SP500": read_fred(os.path.join(FRED_DIR, "fred_SP500.csv")),
}

# 已有内嵌 BLS（回退）
src = open(os.path.join(base, ".us_inflation_embed.js"), encoding="utf-8").read()
existing_rows = json.loads(re.search(r"const US_INFLA=(.*);", src).group(1))
bls = {}
for name in ["CPI", "CORE", "PPI", "CPIW"]:
    bls[name] = {r["date"]: r[name] for r in existing_rows if r.get(name) is not None}

all_data = {**bls, **fred}
months = sorted({m for d in all_data.values() for m in d if m >= "2014-01"})

def yoy(s, k):
    if k not in s: return None
    y, m = int(k[:4]), int(k[5:7]); py = f"{y-1}-{m:02d}"
    return round((s[k]/s[py]-1)*100, 2) if (py in s and s[py]) else None

def mom(s, k):
    if k not in s: return None
    y, m = int(k[:4]), int(k[5:7]); pm = f"{y-1}-12" if m == 1 else f"{y}-{m-1:02d}"
    return round((s[k]/s[pm]-1)*100, 2) if (pm in s and s[pm]) else None

fed = fred["FED"]
def fed_delta(k):
    y, m = int(k[:4]), int(k[5:7]); pm = f"{y-1}-12" if m == 1 else f"{y}-{m-1:02d}"
    return round((fed[k]-fed[pm])*100, 0) if (k in fed and pm in fed and fed[k] and fed[pm]) else None

sp = fred["SP500"]
rows = []
for k in months:
    rows.append({
        "date": k,
        "CPI": bls["CPI"].get(k), "CORE": bls["CORE"].get(k),
        "PPI": bls["PPI"].get(k), "CPIW": bls["CPIW"].get(k),
        "PCE": fred["PCE"].get(k), "PCEL": fred["PCEL"].get(k),
        "FED": fred["FED"].get(k),
        "DGS10": fred["DGS10"].get(k), "DGS20": fred["DGS20"].get(k), "DGS30": fred["DGS30"].get(k),
        "SP500": fred["SP500"].get(k),
        "CPI_YOY": yoy(bls["CPI"], k), "CORE_YOY": yoy(bls["CORE"], k), "PPI_YOY": yoy(bls["PPI"], k),
        "PCE_YOY": yoy(fred["PCE"], k), "PCEL_YOY": yoy(fred["PCEL"], k),
        "CPI_MOM": mom(bls["CPI"], k), "CORE_MOM": mom(bls["CORE"], k), "PPI_MOM": mom(bls["PPI"], k),
        "PCE_MOM": mom(fred["PCE"], k), "PCEL_MOM": mom(fred["PCEL"], k),
        "FED_DELTA": fed_delta(k),
        "SP500_MOM": mom(sp, k), "SP500_YOY": yoy(sp, k),
    })
rows.sort(key=lambda x: x["date"])
print(f"合并完成：{len(rows)} 个月，最新 {rows[-1]['date']}")

out = {
    "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "source": "BLS API v1 (CPI/CORE/PPI/CPIW, 回退内嵌) + FRED CSV (PCE/PCEL/FEDFUNDS/DGS10/DGS20/DGS30/SP500)",
    "note": "CPI/核心CPI/PPI 支持浏览器实时直连；其余为构建时嵌入快照（重跑 build_us_inflation.py 即可刷新）",
    "rows": rows,
}
with open(os.path.join(base, "us-inflation-data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
with open(os.path.join(base, ".us_inflation_embed.js"), "w", encoding="utf-8") as f:
    f.write("const US_INFLA=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";")
print("已写出 us-inflation-data.json + .us_inflation_embed.js")
