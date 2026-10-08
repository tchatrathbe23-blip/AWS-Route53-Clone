import json
import re
from typing import List, Dict, Any

def generate_bind_zone(zone_name: str, records: List[Dict[str, Any]]) -> str:
    """
    Export records into standard BIND 9 zone file format
    """
    clean_zone = zone_name.rstrip(".") + "."
    lines = [
        f"; BIND Zone file generated for {clean_zone}",
        f"$ORIGIN {clean_zone}",
        "$TTL 300",
        ""
    ]

    for rec in records:
        r_name = rec["name"]
        if r_name.endswith(clean_zone):
            # relative name
            sub = r_name[:-len(clean_zone)].rstrip(".")
            short_name = sub if sub else "@"
        else:
            short_name = r_name

        ttl = rec.get("ttl", 300)
        rtype = rec["type"]
        val_list = rec.get("records", [])

        for val in val_list:
            if rtype == "TXT" and not (val.startswith('"') and val.endswith('"')):
                val_formatted = f'"{val}"'
            else:
                val_formatted = val
            lines.append(f"{short_name:<20} {ttl:<6} IN  {rtype:<6} {val_formatted}")

    return "\n".join(lines) + "\n"

def parse_bind_zone(content: str, zone_name: str) -> List[Dict[str, Any]]:
    """
    Parses standard BIND format lines into structured record objects
    """
    clean_zone = zone_name.rstrip(".") + "."
    current_origin = clean_zone
    current_ttl = 300

    parsed_records = []

    lines = content.splitlines()
    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith(";"):
            continue

        # Handle directives
        if line.startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) > 1:
                current_origin = parts[1].rstrip(".") + "."
            continue
        if line.startswith("$TTL"):
            parts = line.split()
            if len(parts) > 1:
                try:
                    current_ttl = int(parts[1])
                except ValueError:
                    pass
            continue

        tokens = line.split()
        if len(tokens) < 3:
            continue

        # Basic BIND line parser: [name] [ttl] [class] type rdata...
        # or [name] [class] type rdata...
        name_token = tokens[0]
        idx = 1
        record_ttl = current_ttl

        if idx < len(tokens) and tokens[idx].isdigit():
            record_ttl = int(tokens[idx])
            idx += 1

        if idx < len(tokens) and tokens[idx].upper() in ("IN", "CH", "HS"):
            idx += 1

        if idx >= len(tokens):
            continue

        record_type = tokens[idx].upper()
        idx += 1

        rdata = " ".join(tokens[idx:]).strip()

        # Build fully qualified name
        if name_token == "@":
            fqdn = current_origin
        elif name_token.endswith("."):
            fqdn = name_token
        else:
            fqdn = f"{name_token}.{current_origin}"

        parsed_records.append({
            "name": fqdn,
            "type": record_type,
            "ttl": record_ttl,
            "records": [rdata]
        })

    # Group records by (name, type, ttl)
    grouped: Dict[str, Dict[str, Any]] = {}
    for r in parsed_records:
        key = f"{r['name']}_{r['type']}_{r['ttl']}"
        if key not in grouped:
            grouped[key] = {
                "name": r["name"],
                "type": r["type"],
                "ttl": r["ttl"],
                "routing_policy": "Simple",
                "records": []
            }
        grouped[key]["records"].extend(r["records"])

    return list(grouped.values())
