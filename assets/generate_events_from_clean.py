#!/usr/bin/env python3
"""
Generate events.json (and optional calendar.ics) from a CLEANED spreadsheet
that now includes explicit Start and End time columns.

Designed for the new SAWC CSV you shared (but also works with .xlsx).

Key behavior
- Reads CSV or Excel automatically (by file extension)
- Uses columns: Date, Start, End, Meeting Activity, Mini Competition, Comments,
  Location, Description (case-insensitive; common aliases supported)
- Builds timezone-aware datetimes in Australia/Sydney (configurable)
- If Start/End missing/blank, defaults to 7:30 PM – 9:30 PM on the event date
- Outputs stable JSON array; IDs can be UUID (default) or deterministic
- Optional: also emit an .ics feed via --ics

Examples
  python generate_events_from_clean.py "SAWC 2025 Activities Calendar_Clean.csv" \
      --json events.json --id-mode uuid

  # Also write ICS
  python generate_events_from_clean.py "SAWC 2025 Activities Calendar_Clean.csv" \
      --json events.json --ics calendar.ics --id-mode uuid

  # Excel works too
  python generate_events_from_clean.py "SAWC 2025 Activities Calendar.xlsx" \
      --json events.json --id-mode deterministic
"""

import argparse
import json
import re
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd
from dateutil import tz

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DEFAULT_TZ = "Australia/Sydney"
DEFAULT_START_HM = (19, 30)  # 7:30 PM
DEFAULT_END_HM   = (21, 30)  # 9:30 PM

# Column aliases (lowercased comparison)
ALIASES = {
    "date": {"date", "meeting date", "event date"},
    "start": {"start", "start time", "time", "starttime"},
    "end": {"end", "end time", "finish", "finishtime"},
    "title": {"meeting activity", "title", "event", "activity", "name"},
    "meetingActivity": {"meeting activity", "activity details", "program"},
    "miniCompetition": {"mini competition", "mini-comp", "minicompetition", "mini comp"},
    "comments": {"comments", "comment", "notes to members"},
    "location": {"location", "venue", "address"},
    "description": {"description", "desc", "details", "notes"},
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def find_col(df: pd.DataFrame, key: str) -> Optional[str]:
    """Find a column name in df matching ALIASES[key] (case-insensitive)."""
    lowers = {c: str(c).strip().lower() for c in df.columns}
    for col, low in lowers.items():
        if low in ALIASES.get(key, set()):
            return col
    return None


def parse_time_to_hm(val) -> Optional[Tuple[int, int]]:
    """Return (hour, minute) from diverse time inputs (string, excel fraction, datetime)."""
    if val is None or (isinstance(val, float) and pd.isna(val)) or (isinstance(val, str) and val.strip() == ""):
        return None
    # Excel fractional day
    if isinstance(val, (int, float)) and 0 <= float(val) < 2:
        total_minutes = int(round(float(val) * 24 * 60))
        return total_minutes // 60, total_minutes % 60
    # Datetime-ish
    t = pd.to_datetime(val, errors="coerce")
    if pd.notna(t):
        return int(t.hour), int(t.minute)
    # Plain HH:MM (optionally with AM/PM captured by pandas above)
    m = re.match(r"^\s*(\d{1,2}):(\d{2})\s*$", str(val))
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def build_dt(date_val, hm: Optional[Tuple[int, int]], tzname: str) -> Optional[datetime]:
    if pd.isna(date_val):
        return None
    # Parse date part
    if isinstance(date_val, (pd.Timestamp, datetime)):
        d = pd.to_datetime(date_val).date()
    else:
        d_parsed = pd.to_datetime(str(date_val), dayfirst=True, errors="coerce")
        if pd.isna(d_parsed):
            return None
        d = d_parsed.date()
    # Time
    if hm is None:
        hour, minute = DEFAULT_START_HM
    else:
        hour, minute = int(hm[0]), int(hm[1])
    return datetime(d.year, d.month, d.day, hour, minute, tzinfo=tz.gettz(tzname))


def ensure_end(start_dt: datetime, end_hm: Optional[Tuple[int, int]], tzname: str) -> datetime:
    if end_hm is None:
        # Default end = 21:30 same day in tz
        return datetime(start_dt.year, start_dt.month, start_dt.day, DEFAULT_END_HM[0], DEFAULT_END_HM[1], tzinfo=tz.gettz(tzname))
    eh, em = int(end_hm[0]), int(end_hm[1])
    end_dt = datetime(start_dt.year, start_dt.month, start_dt.day, eh, em, tzinfo=tz.gettz(tzname))
    # If somehow before start, bump by +1 day
    if end_dt <= start_dt:
        end_dt = end_dt + timedelta(days=1)
    return end_dt


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


def make_id(title: str, start_dt: datetime, mode: str) -> str:
    if mode == "uuid":
        return str(uuid.uuid4())
    return f"{start_dt.strftime('%Y%m%d')}-{slugify(title)[:60]}"


def escape_ics(text):
    if text is None:
        return ""
    return str(text).replace("\\", "\\\\").replace("\n", "\\n").replace(",", "\\,").replace(";", "\\;")


def to_ics_utc(dt: datetime) -> str:
    return dt.astimezone(tz.gettz("UTC")).strftime("%Y%m%dT%H%M%SZ")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Generate events.json (and optional .ics) from a cleaned SAWC calendar.")
    ap.add_argument("input_path", help="Path to CSV or XLSX")
    ap.add_argument("--json", required=True, help="Output events.json path")
    ap.add_argument("--ics", help="Optional output calendar.ics path")
    ap.add_argument("--tz", default=DEFAULT_TZ, help=f"Timezone name (default: {DEFAULT_TZ})")
    ap.add_argument("--id-mode", choices=["uuid","deterministic"], default="uuid")
    args = ap.parse_args()

    p = Path(args.input_path)
    if not p.exists():
        raise SystemExit(f"Input not found: {p}")

    # Load data
    if p.suffix.lower() in {".csv"}:
        df = pd.read_csv(p)
    else:
        df = pd.read_excel(p)
    if df.empty:
        raise SystemExit("No rows found in the input sheet.")

    # Resolve columns (case-insensitive)
    col_date  = find_col(df, "date")
    col_start = find_col(df, "start")
    col_end   = find_col(df, "end")
    col_title = find_col(df, "title") or find_col(df, "meetingActivity")
    col_loc   = find_col(df, "location")
    col_desc  = find_col(df, "description")
    col_act   = find_col(df, "meetingActivity")
    col_mini  = find_col(df, "miniCompetition")
    col_comm  = find_col(df, "comments")

    missing = [k for k,v in {"date":col_date, "title":col_title}.items() if v is None]
    if missing:
        raise SystemExit(f"Missing required columns: {missing}. Columns present: {list(df.columns)}")

    events = []
    tzname = args.tz

    for i, row in df.iterrows():
        # Title
        title_raw = row[col_title]
        title = "" if pd.isna(title_raw) else str(title_raw).strip()
        if not title:
            continue

        # Date/time
        start_hm = parse_time_to_hm(row[col_start]) if col_start else None
        end_hm   = parse_time_to_hm(row[col_end]) if col_end else None

        start_dt = build_dt(row[col_date], start_hm, tzname)
        if not start_dt:
            continue
        end_dt = ensure_end(start_dt, end_hm, tzname)

        def get(colname: Optional[str]) -> str:
            if not colname:
                return ""
            val = row[colname]
            return "" if pd.isna(val) else str(val).strip()

        evt = {
            "id": make_id(title, start_dt, args.id_mode),
            "title": title,
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
            "location": get(col_loc),
            "description": get(col_desc),
            "meetingActivity": get(col_act),
            "miniCompetition": get(col_mini),
            "comments": get(col_comm),
        }
        events.append(evt)

    # Sort chronologically
    events.sort(key=lambda e: e["start"])

    # Write JSON
    with open(args.json, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    # Optional ICS
    if args.ics:
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Sydney AWC//Events//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
        ]
        stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        for e in events:
            lines += [
                "BEGIN:VEVENT",
                f"UID:{e['id']}@sydneyawc.com",
                f"DTSTAMP:{stamp}",
                f"DTSTART:{to_ics_utc(datetime.fromisoformat(e['start']))}",
                f"DTEND:{to_ics_utc(datetime.fromisoformat(e['end']))}",
                f"SUMMARY:{escape_ics(e['title'])}",
                f"LOCATION:{escape_ics(e.get('location',''))}",
                f"DESCRIPTION:{escape_ics(e.get('description',''))}",
                "END:VEVENT",
            ]
        lines.append("END:VCALENDAR")
        with open(args.ics, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    print(f"✓ Wrote {len(events)} events to {args.json}" + (f" and {args.ics}" if args.ics else ""))


if __name__ == "__main__":
    main()
