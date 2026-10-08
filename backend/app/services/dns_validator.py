import ipaddress
import re
from typing import List, Tuple

SUPPORTED_RECORD_TYPES = [
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"
]

def validate_dns_record(record_type: str, values: List[str]) -> Tuple[bool, str]:
    if not values:
        return False, "At least one record value is required"

    record_type = record_type.upper()
    if record_type not in SUPPORTED_RECORD_TYPES:
        return False, f"Unsupported record type: {record_type}"

    for val in values:
        val = val.strip()
        if not val:
            continue

        if record_type == "A":
            try:
                ip = ipaddress.IPv4Address(val)
            except ValueError:
                return False, f"Invalid IPv4 address for A record: '{val}'"

        elif record_type == "AAAA":
            try:
                ip = ipaddress.IPv6Address(val)
            except ValueError:
                return False, f"Invalid IPv6 address for AAAA record: '{val}'"

        elif record_type == "CNAME":
            # Must be a domain name
            if len(val) > 253 or not re.match(r'^[a-zA-Z0-9_.-]+$', val):
                return False, f"Invalid domain name for CNAME: '{val}'"

        elif record_type == "MX":
            # Format: <priority> <mail-server> e.g. "10 mail.example.com"
            parts = val.split(maxsplit=1)
            if len(parts) != 2:
                return False, f"MX record must be in format '<priority> <host>', got: '{val}'"
            if not parts[0].isdigit() or not (0 <= int(parts[0]) <= 65535):
                return False, f"MX priority must be an integer between 0 and 65535, got: '{parts[0]}'"

        elif record_type == "SRV":
            # Format: <priority> <weight> <port> <target> e.g. "10 60 5060 bigbox.example.com"
            parts = val.split()
            if len(parts) != 4:
                return False, f"SRV record must be in format '<priority> <weight> <port> <target>', got: '{val}'"
            if not (parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit()):
                return False, "SRV priority, weight, and port must be integers"

        elif record_type == "CAA":
            # Format: <flags> <tag> "<value>" e.g. 0 issue "letsencrypt.org"
            parts = val.split(maxsplit=2)
            if len(parts) < 3:
                return False, f"CAA record must be in format '<flags> <tag> \"<value>\"', got: '{val}'"

    return True, ""
