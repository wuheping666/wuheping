import urllib.request, json, time, sys

def fetch(beg, end, datalen=1500):
    url = (f'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get'
           f'?param=sh000300,day,{beg},{end},{datalen},qfq')
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0', 'Referer': 'https://gu.qq.com/'})
    for t in range(4):
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=30).read())
            if r.get('code') == 0 and isinstance(r['data'], dict):
                sh = r['data'].get('sh000300')
                if isinstance(sh, dict):
                    days = sh.get('day') or sh.get('qfqday') or []
                    return days
            return []
        except Exception as e:
            print(f'  retry {t+1} {beg}-{end}: {e}', file=sys.stderr)
            time.sleep(1)
    return []

windows = [
    ('2008-01-01', '2011-12-31'),
    ('2012-01-01', '2014-12-31'),
    ('2015-01-01', '2017-12-31'),
    ('2018-01-01', '2020-12-31'),
    ('2021-01-01', '2023-12-31'),
    ('2024-01-01', '2026-12-31'),
]
all_d = []
for b, e in windows:
    d = fetch(b, e)
    print(f'  {b}..{e}: {len(d)} rows', '| last', d[-1][0] if d else None)
    all_d.extend(d)

seen = {}
for row in all_d:
    seen[row[0]] = row
merged = list(seen.values())
merged.sort(key=lambda x: x[0])
print('TOTAL:', len(merged), 'FIRST:', merged[0][0], 'LAST:', merged[-1][0])
json.dump(merged, open('.kline_raw.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('saved .kline_raw.json')
