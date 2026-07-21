#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建美国通胀 + 利率 + 美股 数据表（US Inflation / Rates / Equities Dashboard）
- BLS API v1（免key, CORS*）: CPI-U, 核心CPI, PPI最终需求, CPI-W  (用于浏览器实时直连)
- FRED CSV（免key, 无CORS）: PCE, 核心PCE, 联邦基金利率(FEDFUNDS),
      10Y/20Y/30Y 国债收益率(DGS10/20/30), 标普500(SP500)  (构建时嵌入兜底/快照)
输出：us-inflation-data.json + .us_inflation_embed.js（内嵌兜底）
"""
import urllib.request, json, csv, io, datetime, time, os

PROXIES = {}
for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    if os.environ.get(k):
        PROXIES["http"] = os.environ[k]
        PROXIES["https"] = os.environ[k]
        break

def http_get(url, headers=None, retries=4):
    """先直连，失败再走代理（FRED 直连快、BLS 需代理）。空内容视为失败。"""
    last = None
    for i in range(retries):
        # 1) 直连
        try:
            req = urllib.request.Request(url, headers=headers or {})
            raw = urllib.request.urlopen(req, timeout=20).read()
            if raw:
                return raw
        except Exception as e:
            last = e
        # 2) 代理
        if PROXIES:
            try:
                req = urllib.request.Request(url, headers=headers or {})
                handler = urllib.request.ProxyHandler(PROXIES)
                opener = urllib.request.build_opener(handler)
                raw = opener.open(req, timeout=20).read()
                if raw:
                    return raw
            except Exception as e:
                last = e
        time.sleep(1.5)
    raise last or RuntimeError("http_get failed")

# ---------- BLS 序列 ----------
BLS_SERIES = {
    "CPI":   "CUUR0000SA0",   # CPI for All Urban Consumers, All items (SA)
    "CORE":  "CUSR0000SA0L1E",# CPI less food and energy (SA)
    "PPI":   "WPSFD4",        # PPI for Final Demand (SA)
    "CPIW":  "CWUR0000SA0",   # CPI for Urban Wage Earners (SA)
}
START_YEAR = 2014
MIN_MONTH = "2014-01"   # 与 BLS 起始对齐，避免 FRED 长历史把表拉到 1927 年

def fetch_bls(sid):
    url = f"https://api.bls.gov/publicAPI/v1/timeseries/data/{sid}?startyear={START_YEAR}&endyear={datetime.date.today().year}"
    j = json.loads(http_get(url, {"Origin": "https://wuheping.top"}))
    if j.get("status") != "REQUEST_SUCCEEDED":
        raise RuntimeError(f"BLS {sid}: {j.get('message')}")
    out = {}
    for row in j["Results"]["series"][0]["data"]:
        y, p = row["year"], row["period"]
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

# ---------- FRED CSV（月内取末值，即月末值；FEDFUNDS/PCE 本就是月度） ----------
FRED_SERIES = {
    "PCE":   "PCEPI",     # Personal Consumption Expenditures Price Index (SA)
    "PCEL":  "PCEPILFE",  # Core PCE (less food and energy) (SA)
    "FED":   "FEDFUNDS",  # Effective Federal Funds Rate (%)
    "DGS10": "DGS10",     # 10-Year Treasury Constant Maturity Rate (%)
    "DGS20": "DGS20",     # 20-Year Treasury Constant Maturity Rate (%)
    "DGS30": "DGS30",     # 30-Year Treasury Constant Maturity Rate (%)
    "SP500": "SP500",     # S&P 500 Index, monthly average of daily closes
}
def fetch_fred_csv(sid):
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"
    txt = http_get(url, {"User-Agent": "Mozilla/5.0"}).decode("utf-8")
    out = {}
    rdr = csv.reader(io.StringIO(txt))
    next(rdr, None)
    for r in rdr:
        if len(r) < 2 or not r[1].strip():
            continue
        try:
            d = datetime.datetime.strptime(r[0], "%Y-%m-%d").strftime("%Y-%m")
            if d < MIN_MONTH:
                continue
            out[d] = float(r[1])   # 升序，后者覆盖前者 => 月末/当月值
        except Exception:
            pass
    return out

# ---------- 已有内嵌数据（BLS 限流时回退） ----------
def load_existing():
    try:
        p = os.path.join(base, ".us_inflation_embed.js")
        src = open(p, encoding="utf-8").read()
        return {r["date"]: r for r in json.loads(re.search(r"const US_INFLA=(.*);", src).group(1))}
    except Exception:
        return {}
existing = load_existing()

# ---------- 拉取 ----------
print("拉取 BLS ...")
bls_data = {}
for name, sid in BLS_SERIES.items():
    try:
        bls_data[name] = fetch_bls(sid)
    except Exception as e:
        print(f"  ⚠️ BLS {name} 拉取失败（{e}），回退到已有内嵌数据")
        d = {}
        for dt, r in existing.items():
            if r.get(name) is not None:
                d[dt] = r[name]
        bls_data[name] = d
print("拉取 FRED ...")
fred_data = {name: fetch_fred_csv(sid) for name, sid in FRED_SERIES.items()}

all_data = {**bls_data, **fred_data}

# ---------- 合并日期（限制在 MIN_MONTH 之后） ----------
all_months = set()
for d in all_data.values():
    for m in d.keys():
        if m >= MIN_MONTH:
            all_months.add(m)
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

# 联邦基金利率环比变动（基点 bps）
fed = fred_data["FED"]
def fed_delta(key):
    y, m = int(key[:4]), int(key[5:7])
    pm = f"{y-1}-12" if m == 1 else f"{y}-{m-1:02d}"
    if key in fed and pm in fed and fed[key] and fed[pm]:
        return round((fed[key] - fed[pm]) * 100, 0)  # 百分点*100 = bps
    return None

sp = fred_data["SP500"]
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
        "FED":  fred_data["FED"].get(k),
        "DGS10":fred_data["DGS10"].get(k),
        "DGS20":fred_data["DGS20"].get(k),
        "DGS30":fred_data["DGS30"].get(k),
        "SP500":fred_data["SP500"].get(k),
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
        "FED_DELTA": fed_delta(k),
        "SP500_MOM": mom(sp, k),
        "SP500_YOY": yoy(sp, k),
    })

rows.sort(key=lambda x: x["date"])
print(f"合并完成：{len(rows)} 个月，最新 {rows[-1]['date']}")

out = {
    "updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "source": "BLS API v1 (CPI/CORE/PPI/CPIW) + FRED CSV (PCE/PCEL/FEDFUNDS/DGS10/DGS20/DGS30/SP500)",
    "note": "CPI/核心CPI/PPI 支持浏览器实时直连；PCE/核心PCE/联邦基金利率/国债收益率/标普500 为构建时嵌入快照（重跑本脚本即可刷新）",
    "rows": rows,
}
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(base, "us-inflation-data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
with open(os.path.join(base, ".us_inflation_embed.js"), "w", encoding="utf-8") as f:
    f.write("const US_INFLA=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";")
print("已写出 us-inflation-data.json + .us_inflation_embed.js")
