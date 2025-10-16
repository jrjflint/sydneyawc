#!/usr/bin/env python3
"""
generate_ics.py — Build an iCalendar (.ics) from events.json with Australia/Sydney TZ

Usage:
  python generate_ics.py
  python generate_ics.py --in ./assets/events.json --out ./assets/sawc-events.ics
Options:
  --default-location "Club Rivers, 32 Littleton St, Riverwood NSW 2210"
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

# ---- Defaults ----
TZID = "Australia/Sydney"
CAL_NAME = "Sydney Amateur Winemakers Club"
CAL_DESC = "Meetings and club events for the Sydney Amateur Winemakers Club"
PRODID  = "-//Sydney AWC//sawc-events//EN"
DEFAULT_LOCATION = "Club Rivers, 32 Littleton St, Riverwood NSW 2210"

def esc(s: str | None) -> str:
    """Escape text for ICS fields."""
    if s is None: s = ""
    return (s.replace("\\", "\\\\")
             .replace(";", "\\;")
             .replace(",", "\\,")
             .replace("\r\n", "\\n")
             .replace("\n", "\\n")
             .replace("\r", "\\n"))

def fold(line: str) -> str:
    """Fold long lines to 75 octets (~75 chars for ASCII)."""
    res, s = [], line
    while len(s) > 74:
        res.append(s[:74])
        s = " " + s[74:]
    res.append(s)
    return "\r\n".join(res)

def fmt_local(iso_str: str) -> str:
    """
    Parse ISO-8601 with offset, return local wall-clock time as YYYYMMDDTHHMMSS.
    We keep the *clock* value and pair with TZID so DST is handled by clients.
    """
    try:
        dt_obj = dt.datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except Exception as e:
        raise ValueError(f"Invalid ISO datetime: {iso_str!r}") from e
    return dt_obj.strftime("%Y%m%dT%H%M%S")

def build_description(ev: dict) -> str:
    parts = []
    if ev.get("description"):
        parts.append(str(ev["description"]))
    title = ev.get("title") or ev.get("meetingActivity") or "Event"
    if ev.get("meetingActivity") and ev["meetingActivity"] != title:
        parts.append(f"Activity: {ev['meetingActivity']}")
    if ev.get("miniCompetition"):
        parts.append(f"Mini competition: {ev['miniCompetition']}")
    if ev.get("comments"):
        parts.append(f"Notes: {ev['comments']}")
    return esc("\n".join([p for p in parts if str(p).strip()]))

def to_vevent(ev: dict, dtstamp_utc: str, tzid: str, default_location: str) -> list[str]:
    uid = f"{(ev.get('id') or '').strip() or ev.get('title','event').strip()}@sydneyawc.com"
    title = ev.get("title") or ev.get("meetingActivity") or "Event"
    dtstart = fmt_local(ev["start"])
    dtend   = fmt_local(ev["end"])
    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp_utc}Z",
        f"DTSTART;TZID={tzid}:{dtstart}",
        f"DTEND;TZID={tzid}:{dtend}",
        f"SUMMARY:{esc(title)}",
    ]
    loc = (ev.get("location") or "").strip() or default_location
    if loc:
        lines.append(f"LOCATION:{esc(loc)}")
    desc = build_description(ev)
    if desc:
        lines.append(f"DESCRIPTION:{desc}")
    lines.append("END:VEVENT")
    return [fold(l) for l in lines]

def build_vtimezone(tzid: str) -> list[str]:
    """Return a VTIMEZONE block for the supplied tzid (limited support)."""
    if tzid != "Australia/Sydney":
        return []

    lines = [
        "BEGIN:VTIMEZONE",
        f"TZID:{tzid}",
        "X-LIC-LOCATION:Australia/Sydney",
        "BEGIN:STANDARD",
        "TZOFFSETFROM:+1100",
        "TZOFFSETTO:+1000",
        "TZNAME:AEST",
        "DTSTART:19700405T030000",
        "RRULE:FREQ=YEARLY;BYMONTH=4;BYDAY=1SU",
        "END:STANDARD",
        "BEGIN:DAYLIGHT",
        "TZOFFSETFROM:+1000",
        "TZOFFSETTO:+1100",
        "TZNAME:AEDT",
        "DTSTART:19701004T020000",
        "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=1SU",
        "END:DAYLIGHT",
        "END:VTIMEZONE",
    ]
    return [fold(l) for l in lines]

def generate_ics(events: list[dict], tzid: str, cal_name: str, cal_desc: str,
                 prodid: str, default_location: str) -> str:
    now_utc = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{prodid}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{esc(cal_name)}",
        f"X-WR-CALDESC:{esc(cal_desc)}",
        f"X-WR-TIMEZONE:{tzid}",
    ]

    tz_block = build_vtimezone(tzid)
    if tz_block:
        lines.extend(tz_block)
    for ev in events:
        if "start" not in ev or "end" not in ev or not ev["start"] or not ev["end"]:
            raise ValueError(f"Event missing required 'start'/'end': {ev}")
        lines.extend(to_vevent(ev, now_utc, tzid, default_location))
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Generate .ics from events.json (Sydney TZ)")
    ap.add_argument("--in", dest="in_path", default="./assets/events.json", help="Path to events.json")
    ap.add_argument("--out", dest="out_path", default="./assets/sawc-events.ics", help="Path to write .ics")
    ap.add_argument("--tzid", default=TZID, help="TZID to use (default Australia/Sydney)")
    ap.add_argument("--name", default=CAL_NAME, help="Calendar display name")
    ap.add_argument("--desc", default=CAL_DESC, help="Calendar description")
    ap.add_argument("--prodid", default=PRODID, help="PRODID string")
    ap.add_argument("--default-location", default=DEFAULT_LOCATION, help="Fallback LOCATION when JSON is blank")
    args = ap.parse_args(argv)

    in_path = Path(args.in_path)
    out_path = Path(args.out_path)

    if not in_path.exists():
        print(f"ERROR: {in_path} not found", file=sys.stderr)
        return 2

    try:
        events = json.loads(in_path.read_text(encoding="utf-8"))
        if not isinstance(events, list):
            raise ValueError("Root JSON must be a list of events")
    except Exception as e:
        print(f"ERROR: Failed to read/parse {in_path}: {e}", file=sys.stderr)
        return 3

    try:
        ics = generate_ics(events, args.tzid, args.name, args.desc, args.prodid, args.default_location)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(ics, encoding="utf-8", newline="")
    except Exception as e:
        print(f"ERROR: Failed to generate/write ICS: {e}", file=sys.stderr)
        return 4

    print(f"Wrote {out_path} with {len(events)} events.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
