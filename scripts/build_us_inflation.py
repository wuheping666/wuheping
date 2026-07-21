#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建美国通胀数据表（US Inflation Dashboard）
- BLS API v1（免key, CORS*）: CPI-U, 核心CPI, PPI最终需求, CPI-W  (用于浏览器实时直连)
- FRED CSV（免key, 无CORS）: PCE, 核心PCE  (构建时嵌入，作为兜底/补充)
输出：us-inflation-data.json + .us_inflation_embed.js（内嵌兜底）
"""
import urllib.request, json, csv, io, datetime, time, os

# ---------- 代理（Windows 环境 urllib 读取环境变量） ----------
PROXIES = {}
for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    if os.environ.get(k):
        PROXIES["http"] = os.environ[k]
        PROXIES["https"] = os.environ[k]
        break

def http_get(url, headers=None, retries=3):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers or {})
            if PROXIES:
                handler = urllib.request.ProxyHandler(PROXIES)
                opener = urllib.request.build_opener(handler)
                raw = opener.open(req, timeout=20).read()
            else:
                raw = urllib.request.urlopen(req, timeout=20).read()
            return raw
        except Exception as e:
            last = e
            time.sleep(1.5)
    raise last

# ---------- BLS 序列 ----------
BLS_SERIES = {
    "CPI":   "CUUR0000SA0",   # CPI for All Urban Consumers, All items (SA)
    "CORE":  "CUSR0000SA0L1E",# CPI less food and energy (SA)
    "PPI":   "WPSFD4",        # PPI for Final Demand (SA)
    "CPIW":  "CWUR0000SA0",   # CPI for Urban Wage Earners (SA)
}
START_YEAR = 2014

def fetch_bls(sid):
    url = f"https://api.bls.gov/publicAPI/v1/timeseries/data/{sid}?startyear={START_YEAR}&endyear={datetime.date.today().year}"
    j = json.loads(http_get(url, {"Origin": "https://wuheping.top"}))
    if j.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS {sid}: {j.get('message')}")
    out = {}
    for row in j["Results"]["series"][0]["data"]:
        y, p = row["year"], row["period"]
        # 仅保留月度 M01–M12；M13 为年度平均值，跳过
        if not (p.startswith("M") and len(p) == 3 and p[1:].isdigit()):
            continue
        m = int(p[1:])
        if m < 1 or m > 12:
            continue
        v = row.get("value", "").strip()
        if not v or v == "-":
            continue
        out[f"{y}-{m:02d}"] = float(v)
    return out

# ---------- FRED CSV ----------
FRED_SERIES = {
    "PCE":  "PCEPI",     # Personal Consumption Expenditures Price Index (SA)
    "PCEL": "PCEPILFE",  # Core PCE (less food and energy) (SA)
}
def fetch_fred_csv(sid):
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"
    txt = http_get(url, {}).decode("utf-8")
    out = {}
    rdr = csv.reader(io.StringIO(txt))
    next(rdr, None)
    for r in rdr:
        if len(r) < 2 or not r[1].strip():
            continue
        try:
            d = datetime.datetime.strptime(r[0], "%Y-%m-%d").strftime("%Y-%m")
            out[d] = float(r[1])
        except Exception:
            pass
    return out

# ---------- 拉取 ----------
print("拉取 BLS ...")
bls_data = {name: fetch_bls(sid) for name, sid in BLS_SERIES.items()}
print("拉取 FRED ...")
fred_data = {name: fetch_fred_csv(sid) for name, sid in FRED_SERIES.items()}

all_data = {**bls_data, **fred_data}

# ---------- 合并日期 ----------
all_months = set()
for d in all_data.values():
    all_months.update(d.keys())
months = sorted(all_months)

def yoy(series, key):
    if key not in series: return None
    y, m = int(key[:4]), int(key[5:7])
    py = f"{y-1}-{m:02d}"
    if py in series and series[py]:
        return round((series[key] / series[py] - 1) * 100, 2)
    return None

def mom(series, key):
    if key not in series: return None
    y, m = int(key[:4]), int(key[5:7])
    if m == 1:
        pm = f"{y-1}-12"
    else:
        pm = f"{y}-{m-1:02d}"
    if pm in series and series[pm]:
        return round((series[key] / series[pm] - 1) * 100, 2)
    return None

rows = []
for k in months:
    rows.append({
        "date": k,
        "CPI":  bls_data["CPI"].get(k),
        "CORE": bls_data["CORE"].get(k),
        "PPI":  bls_data["PPI"].get(k),
        "CPIW": bls_data["CPIW"].get(k),
        "PCE":  fred_data["PCE"].get(k),
        "PCEL": fred_data["PCEL"].get(k),
        "CPI_YOY":  yoy(bls_data["CPI"], k),
        "CORE_YOY": yoy(bls_data["CORE"], k),
        "PPI_YOY":  yoy(bls_data["PPI"], k),
        "PCE_YOY":  yoy(fred_data["PCE"], k),
        "PCEL_YOY": yoy(fred_data["PCEL"], k),
        "CPI_MOM":  mom(bls_data["CPI"], k),
        "CORE_MOM": mom(bls_data["CORE"], k),
        "PPI_MOM":  mom(bls_data["PPI"], k),
        "PCE_MOM":  mom(fred_data["PCE"], k),
        "PCEL_MOM": mom(fred_data["PCEL"], k),
    })

rows.sort(key=lambda x: x["date"])
print(f"合并完成：{len(rows)} 个月，最新 {rows[-1]['date']}")

out = {
    "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "source": "BLS API v1 (CPI/CORE/PPI/CPIW) + FRED CSV (PCE/PCEL)",
    "note": "CPI/核心CPI/PPI 支持浏览器实时直连；PCE/核心PCE 为构建时嵌入快照",
    "rows": rows,
}
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(base, "us-inflation-data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
with open(os.path.join(base, ".us_inflation_embed.js"), "w", encoding="utf-8") as f:
    f.write("const US_INFLA=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";")
print("已写出 us-inflation-data.json + .us_inflation_embed.js")
