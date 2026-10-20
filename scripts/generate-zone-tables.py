"""Generate public IANA transition tables, without personal data or network access.

Run with the system tzdata version recorded in /usr/share/zoneinfo/tzdata.zi.
The original Seoul 2025b table remains unchanged. Other zones cover birth inputs
and ten decades (1898 through 2152), including historical all-year DST.
"""
import datetime as dt
import json
import pathlib
import re
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
source = (ROOT / 'src/calendar/locations.js').read_text()
zones = sorted(set(re.findall(r"zone:'([^']+)'", source)) - {'Asia/Seoul'})
version = pathlib.Path('/usr/share/zoneinfo/tzdata.zi').read_text().splitlines()[0].split()[-1]
start = int(dt.datetime(1898, 1, 1, tzinfo=dt.timezone.utc).timestamp())
end = int(dt.datetime(2153, 1, 1, tzinfo=dt.timezone.utc).timestamp())
tables = {}
for name in zones:
    zone = ZoneInfo(name)

    def offset(timestamp):
        local = dt.datetime.fromtimestamp(timestamp, dt.timezone.utc).astimezone(zone)
        seconds = int(local.utcoffset().total_seconds())
        saving = int(local.dst().total_seconds())
        # TZif stores an isdst flag, not SAVE. CPython may report only one hour
        # for wartime British Double Summer Time. IANA's Europe/London zone
        # has base offset 0 with G/E rules; the 1968-71 fixed BST interval has
        # isdst false and must stay a standard-offset change, not DST removal.
        if name == 'Europe/London' and saving:
            saving = seconds
        return seconds, saving

    previous = offset(start)
    rows = [[start * 1000, *previous]]
    cursor = start
    while cursor < end:
        following = min(cursor + 86400, end)
        current = offset(following)
        if current != previous:
            left, right = cursor, following
            while right - left > 1:
                middle = (left + right) // 2
                if offset(middle) == previous:
                    left = middle
                else:
                    right = middle
            rows.append([right * 1000, *offset(right)])
        previous = current
        cursor = following
    tables[name] = rows

result = {'tzdb': version, 'source': 'IANA tzdb via Python zoneinfo; https://www.iana.org/time-zones',
          'from': '1898-01-01', 'through': '2152-12-31', 'columns': ['atMilliseconds', 'offsetSeconds', 'dstSeconds'], 'zones': tables}
target = ROOT / 'src/calendar/foreign-transitions.json'
target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{len(zones)} zones / {sum(map(len, tables.values()))} transitions / IANA {version} / {target.stat().st_size} bytes')
