#!/usr/bin/env python3
"""
generate_ics.py — Build an iCalendar (.ics) from events.json

Usage:
  python generate_ics.py                  # reads ./assets/events.json -> writes ./assets/sawc-events.ics
  python generate_ics.py --in path/to/events.json --out path/to/sawc-events.ics

Notes:
- Expects events like:
  {
    "id": "uuid",
    "title": "Meeting Title",
    "start": "2025-10-02T19:30:00+10:00",
    "end":   "2025-10-02T21:30:00+10:00",
    "location": "Club Rivers, 32 Littleton St, Riverwood NSW 2210",
    "description": "",
    "meetingActivity": "",
    "miniCompetition": "",
    "comments": ""
  }
- DTSTART/DTEND are emitted as local wall-clock times using TZID=Australia/Sydney.
- DTSTAMP is emitted in UTC with 'Z' (RFC5545-compliant).
- Lines are folded to 75 octets and text is escaped per RFC5545.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

# ---- Config ----
TZID = "Australia/Sydney"
CAL_NAME = "Sydney Amateur Winemakers Club"
CAL_DESC = "Meetings and club events for the Sydney Amateur Winemakers Club"
PRODID  = "-//Sydney AWC//sawc-events//EN"


def esc(s: str | None) -> str:
    """Escape text for ICS fields."""
    if s is None:
        s = ""
    return (
        s.replace("\\", "\\\\")
         .replace(";", "\\;")
         .replace(",", "\\,")
         .replace("\r\n", "\\n")
         .replace("\n", "\\n")
         .replace("\r", "\\n")
    )


def fold(line: str) -> str:
    """Fold long lines to 75 octets (~75 chars for ASCII)."""
    res = []
    s = line
    while len(s) > 74:
        res.append(s[:74])
        s = " " + s[74:]
    res.append(s)
    return "\r\n".join(res)


def fmt_local(iso_str: str) -> str:
    """
    Parse ISO-8601 with offset, then return local wall-clock time as YYYYMMDDTHHMMSS.
    We keep the local *clock* value and pair it with TZID in the ICS property.
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


def to_vevent(ev: dict, dtstamp_utc: str) -> list[str]:
    uid = f"{(ev.get('id') or '').strip() or ev.get('title','event').strip()}@sydneyawc.com"
    title = ev.get("title") or ev.get("meetingActivity") or "Event"
    dtstart = fmt_local(ev["start"])
    dtend   = fmt_local(ev["end"])
    vevent = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp_utc}Z",
        f"DTSTART;TZID={TZID}:{dtstart}",
        f"DTEND;TZID={TZID}:{dtend}",
        f"SUMMARY:{esc(title)}",
    ]
    if ev.get("location"):
        vevent.append(f"LOCATION:{esc(ev['location'])}")
    desc = build_description(ev)
    if desc:
        vevent.append(f"DESCRIPTION:{desc}")
    vevent.append("END:VEVENT")
    return [fold(l) for l in vevent]


def generate_ics(events: list[dict]) -> str:
    now_utc = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODID}",
        "CALSCALE:GREGORIAN",
        f"X-WR-CALNAME:{esc(CAL_NAME)}",
        f"X-WR-CALDESC:{esc(CAL_DESC)}",
        f"X-WR-TIMEZONE:{TZID}",
    ]
    for ev in events:
        for required in ("start", "end"):
            if required not in ev or not ev[required]:
                raise ValueError(f"Event missing required field: {required}\n{ev}")
        lines.extend(to_vevent(ev, now_utc))
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Generate an .ics from events.json")
    p.add_argument("--in", dest="in_path", default="./assets/events.json", help="Path to events.json")
    p.add_argument("--out", dest="out_path", default="./assets/sawc-events.ics", help="Path to write .ics")
    args = p.parse_args(argv)

    in_path = Path(args.in_path)
    out_path = Path(args.out_path)
    if not in_path.exists():
        print(f"ERROR: {in_path} not found", file=sys.stderr)
        return 2

    try:
        events = json.loads(in_path.read_text(encoding="utf-8"))
        if not isinstance(events, list):
            raise ValueError("Root of JSON must be a list of events")
    except Exception as e:
        print(f"ERROR: Failed to read/parse {in_path}: {e}", file=sys.stderr)
        return 3

    try:
        ics = generate_ics(events)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(ics, encoding="utf-8", newline="")
    except Exception as e:
        print(f"ERROR: Failed to generate/write ICS: {e}", file=sys.stderr)
        return 4

    print(f"Wrote {out_path} with {len(events)} events.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
