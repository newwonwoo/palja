"""Offline test oracle. No imports or data from Palja's implementation.

Reproduce with Python 3.12, pyswisseph==2.10.3.2,
korean-lunar-calendar==0.3.1 and system IANA tzdb 2026b.
Swiss Ephemeris is used ONLY by this developer fixture generator, never shipped.
"""
import calendar
import datetime as dt
import json
from pathlib import Path
from zoneinfo import ZoneInfo

import swisseph as swe
from korean_lunar_calendar import KoreanLunarCalendar

UTC = dt.timezone.utc
YEARS = sorted(set(range(1900, 2051, 10)) | {2024})
ZONES = ['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Taipei',
         'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Kolkata',
         'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York',
         'America/Los_Angeles', 'America/Chicago', 'America/Toronto',
         'Australia/Sydney', 'Pacific/Auckland']


def jd(instant):
    return instant.timestamp() / 86400 + 2440587.5


def longitude(day):
    # Apparent geocentric tropical ecliptic longitude, UT -> TT handled by Swiss.
    values, flags = swe.calc_ut(day, swe.SUN, swe.FLG_MOSEPH)
    assert flags & swe.FLG_MOSEPH
    return values[0]


terms, equations, dates, zones = [], [], [], []
for year in YEARS:
    for index in range(24):
        target = (285 + index * 15) % 360
        start = dt.datetime(year, index // 2 + 1, 1 if index % 2 == 0 else 15, tzinfo=UTC)
        lo, hi = jd(start), jd(start + dt.timedelta(days=18))
        distance = lambda x: (longitude(x) - target + 180) % 360 - 180
        assert distance(lo) < 0 < distance(hi)
        for _ in range(40):
            mid = (lo + hi) / 2
            if distance(mid) < 0:
                lo = mid
            else:
                hi = mid
        terms.append([year, index, round(((lo + hi) / 2 - 2440587.5) * 86400000)])
    for month in range(1, 13):
        instant = dt.datetime(year, month, 15, 12, tzinfo=UTC)
        equations.append([instant.isoformat(), swe.time_equ(jd(instant)) * 1440])

# The Python/JS Korean calendars share an author and calendar data. This tests
# port/conversion integration, not independent historical lunar observations.
for year in range(1900, 2051):
    for month, day in [(1, 31), (2, calendar.monthrange(year, 2)[1]), (6, 15), (12, 31)]:
        lunar = KoreanLunarCalendar()
        assert lunar.setSolarDate(year, month, day)
        dates.append([f'{year:04}-{month:02}-{day:02}', lunar.lunarYear,
                      lunar.lunarMonth, lunar.lunarDay, lunar.isIntercalation,
                      lunar.getChineseGapJaString().split()[2]])

# Independent IANA interpretation: monthly coverage plus every discovered UTC
# transition sampled a second before/at/after, not copied application tables.
for name in ZONES:
    zone = ZoneInfo(name)
    samples = set()
    start = dt.datetime(1900, 1, 1, tzinfo=UTC)
    stop = dt.datetime(2051, 1, 1, tzinfo=UTC)
    previous = start
    def offsets(instant):
        local = instant.astimezone(zone)
        offset, dst = int(local.utcoffset().total_seconds()), int(local.dst().total_seconds())
        # TZif stores only isdst; Python guesses SAVE from adjacent types and
        # reports +1h for wartime BDST. IANA Europe/London base 0 / rule G SAVE 2
        # explicitly specifies +2h in 1941–1947. Retain raw offset, correct SAVE.
        if name == 'Europe/London' and 1941 <= instant.year <= 1947 and offset == 7200:
            dst = 7200
        return offset, dst
    old = offsets(start)
    current = start + dt.timedelta(days=1)
    while current <= stop:
        new = offsets(current)
        if new != old:
            lo, hi = int(previous.timestamp()), int(current.timestamp())
            while hi - lo > 1:
                mid = (lo + hi) // 2
                if offsets(dt.datetime.fromtimestamp(mid, UTC)) == old:
                    lo = mid
                else:
                    hi = mid
            samples.update([hi - 1, hi, hi + 1])
        if current.day == 15:
            samples.add(int(current.timestamp()))
        previous, old = current, new
        current += dt.timedelta(days=1)
    zones.append({'zone': name, 'samples': [[t * 1000, *offsets(dt.datetime.fromtimestamp(t, UTC))] for t in sorted(samples)]})

out = {'sources': {'solar': 'Swiss Ephemeris Moshier, pyswisseph 2.10.3.2; apparent geocentric tropical solar longitude',
                   'eot': 'Swiss Ephemeris time_equ; comparison target for NOAA approximation',
                   'lunarAndDay': 'korean-lunar-calendar Python 0.3.1 (correlated data with JS port)',
                   'timezone': Path('/usr/share/zoneinfo/tzdata.zi').read_text().splitlines()[0]},
       'terms': terms, 'equations': equations, 'dates': dates, 'zones': zones}
destination = Path(__file__).resolve().parents[1] / 'tests/fixtures/independent-calendar.json'
destination.parent.mkdir(exist_ok=True)
destination.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '\n')
print(json.dumps({key: len(out[key]) for key in ['terms', 'equations', 'dates', 'zones']}))
