import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import HostedZone, DnsRecord
from app.schemas.schemas import (
    DnsRecordCreate, DnsRecordUpdate, DnsRecordOut, BulkDeleteRecords, ZoneImportResponse
)
from app.services.dns_validator import validate_dns_record
from app.services.bind_service import parse_bind_zone

router = APIRouter(prefix="/records", tags=["DNS Records"])

def format_record_out(r: DnsRecord) -> dict:
    return {
        "id": r.id,
        "hosted_zone_id": r.hosted_zone_id,
        "name": r.name,
        "type": r.type,
        "ttl": r.ttl,
        "routing_policy": r.routing_policy,
        "weight": r.weight,
        "health_check_id": r.health_check_id,
        "is_alias": r.is_alias,
        "alias_target": r.alias_target,
        "records": json.loads(r.records) if r.records else [],
        "created_at": r.created_at,
        "updated_at": r.updated_at
    }

@router.get("/zone/{zone_id}", response_model=List[DnsRecordOut])
def get_zone_records(
    zone_id: str,
    search: Optional[str] = Query(None, description="Search by record name"),
    type: Optional[str] = Query(None, description="Filter by record type (A, CNAME, etc)"),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    query = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id)
    if search:
        query = query.filter(DnsRecord.name.ilike(f"%{search}%"))
    if type:
        query = query.filter(DnsRecord.type == type.upper())

    records = query.offset(skip).limit(limit).all()
    return [format_record_out(r) for r in records]

@router.post("/zone/{zone_id}", response_model=DnsRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: str,
    rec_in: DnsRecordCreate,
    db: Session = Depends(get_db)
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    # Normalize record name
    norm_name = rec_in.name.strip()
    if not norm_name.endswith("."):
        if norm_name == "@" or not norm_name:
            norm_name = zone.name
        elif not norm_name.endswith(zone.name.rstrip(".")):
            norm_name = f"{norm_name}.{zone.name}"
        else:
            norm_name = f"{norm_name}."

    rec_type = rec_in.type.upper()

    # Validate syntax if not alias
    if not rec_in.is_alias:
        is_valid, err_msg = validate_dns_record(rec_type, rec_in.records)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)

    # Check for existing record of same name and type for Simple routing
    if rec_in.routing_policy == "Simple":
        existing = db.query(DnsRecord).filter(
            DnsRecord.hosted_zone_id == zone_id,
            DnsRecord.name == norm_name,
            DnsRecord.type == rec_type
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"A {rec_type} record with name '{norm_name}' already exists in this zone."
            )

    record = DnsRecord(
        hosted_zone_id=zone_id,
        name=norm_name,
        type=rec_type,
        ttl=rec_in.ttl,
        routing_policy=rec_in.routing_policy,
        weight=rec_in.weight,
        health_check_id=rec_in.health_check_id,
        is_alias=rec_in.is_alias,
        alias_target=rec_in.alias_target,
        records=json.dumps(rec_in.records)
    )
    db.add(record)
    
    # Update zone count
    zone.record_count = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id).count() + 1

    db.commit()
    db.refresh(record)
    return format_record_out(record)

@router.get("/{record_id}", response_model=DnsRecordOut)
def get_record(record_id: str, db: Session = Depends(get_db)):
    r = db.query(DnsRecord).filter(DnsRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="DNS record not found")
    return format_record_out(r)

@router.put("/{record_id}", response_model=DnsRecordOut)
def update_record(record_id: str, rec_in: DnsRecordUpdate, db: Session = Depends(get_db)):
    r = db.query(DnsRecord).filter(DnsRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="DNS record not found")

    if rec_in.records is not None:
        if not (rec_in.is_alias or r.is_alias):
            is_valid, err_msg = validate_dns_record(r.type, rec_in.records)
            if not is_valid:
                raise HTTPException(status_code=400, detail=err_msg)
        r.records = json.dumps(rec_in.records)

    if rec_in.ttl is not None:
        r.ttl = rec_in.ttl
    if rec_in.routing_policy is not None:
        r.routing_policy = rec_in.routing_policy
    if rec_in.weight is not None:
        r.weight = rec_in.weight
    if rec_in.is_alias is not None:
        r.is_alias = rec_in.is_alias
    if rec_in.alias_target is not None:
        r.alias_target = rec_in.alias_target

    db.commit()
    db.refresh(r)
    return format_record_out(r)

@router.delete("/{record_id}")
def delete_record(record_id: str, db: Session = Depends(get_db)):
    r = db.query(DnsRecord).filter(DnsRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="DNS record not found")

    zone_id = r.hosted_zone_id
    db.delete(r)

    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone:
        zone.record_count = max(0, db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id).count() - 1)

    db.commit()
    return {"message": "Record successfully deleted"}

@router.post("/bulk-delete")
def bulk_delete_records(payload: BulkDeleteRecords, db: Session = Depends(get_db)):
    deleted_count = db.query(DnsRecord).filter(DnsRecord.id.in_(payload.record_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} record(s)"}

@router.post("/zone/{zone_id}/import-bind", response_model=ZoneImportResponse)
async def import_bind_file(zone_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    content_bytes = await file.read()
    content_str = content_bytes.decode("utf-8", errors="replace")

    parsed_records = parse_bind_zone(content_str, zone.name)
    count = 0
    for p in parsed_records:
        # Avoid duplicating SOA or default NS unless wanted
        new_rec = DnsRecord(
            hosted_zone_id=zone_id,
            name=p["name"],
            type=p["type"],
            ttl=p["ttl"],
            routing_policy=p.get("routing_policy", "Simple"),
            records=json.dumps(p["records"])
        )
        db.add(new_rec)
        count += 1

    zone.record_count = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id).count() + count
    db.commit()
    return {
        "message": f"Successfully imported {count} DNS records from BIND file.",
        "zone_id": zone_id,
        "imported_records_count": count
    }
