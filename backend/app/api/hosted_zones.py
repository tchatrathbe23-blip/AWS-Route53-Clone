import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import HostedZone, DnsRecord
from app.schemas.schemas import (
    HostedZoneCreate, HostedZoneUpdate, HostedZoneOut, HostedZoneDetail,
    BulkDeleteHostedZones
)
from app.services.bind_service import generate_bind_zone

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

def get_default_records(zone_name: str, zone_id: str):
    clean_name = zone_name.rstrip(".") + "."
    return [
        DnsRecord(
            hosted_zone_id=zone_id,
            name=clean_name,
            type="NS",
            ttl=172800,
            routing_policy="Simple",
            records=json.dumps([
                f"ns-1024.awsdns-00.org.",
                f"ns-512.awsdns-00.net.",
                f"ns-256.awsdns-00.com.",
                f"ns-128.awsdns-00.co.uk."
            ])
        ),
        DnsRecord(
            hosted_zone_id=zone_id,
            name=clean_name,
            type="SOA",
            ttl=900,
            routing_policy="Simple",
            records=json.dumps([
                f"ns-1024.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
            ])
        )
    ]

@router.get("", response_model=List[HostedZoneOut])
def list_hosted_zones(
    search: Optional[str] = Query(None, description="Search by zone name"),
    type: Optional[str] = Query(None, description="Filter by Public or Private"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(HostedZone)
    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))
    if type:
        query = query.filter(HostedZone.type == type)
    
    zones = query.offset(skip).limit(limit).all()
    # update actual record counts
    for z in zones:
        z.record_count = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == z.id).count()
    return zones

@router.post("", response_model=HostedZoneOut, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(zone_in: HostedZoneCreate, db: Session = Depends(get_db)):
    clean_name = zone_in.name.strip().rstrip(".") + "."
    zone = HostedZone(
        name=clean_name,
        type=zone_in.type,
        comment=zone_in.comment,
        vpc_id=zone_in.vpc_id,
        vpc_region=zone_in.vpc_region,
        record_count=2
    )
    db.add(zone)
    db.flush()

    # Automatically add Route53 default NS and SOA records
    defaults = get_default_records(clean_name, zone.id)
    for rec in defaults:
        db.add(rec)

    db.commit()
    db.refresh(zone)
    return zone

@router.get("/{zone_id}", response_model=HostedZoneDetail)
def get_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    records = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id).all()
    out_records = []
    for r in records:
        out_records.append({
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
        })

    return {
        "id": zone.id,
        "name": zone.name,
        "type": zone.type,
        "comment": zone.comment,
        "vpc_id": zone.vpc_id,
        "vpc_region": zone.vpc_region,
        "record_count": len(out_records),
        "created_at": zone.created_at,
        "updated_at": zone.updated_at,
        "records": out_records
    }

@router.put("/{zone_id}", response_model=HostedZoneOut)
def update_hosted_zone(zone_id: str, zone_in: HostedZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if zone_in.comment is not None:
        zone.comment = zone_in.comment

    db.commit()
    db.refresh(zone)
    zone.record_count = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone.id).count()
    return zone

@router.delete("/{zone_id}")
def delete_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return {"message": f"Hosted zone {zone_id} successfully deleted"}

@router.post("/bulk-delete")
def bulk_delete_hosted_zones(payload: BulkDeleteHostedZones, db: Session = Depends(get_db)):
    deleted_count = db.query(HostedZone).filter(HostedZone.id.in_(payload.zone_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} hosted zone(s)"}

@router.get("/{zone_id}/export")
def export_hosted_zone(zone_id: str, format: str = Query("json", regex="^(json|bind)$"), db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    records = db.query(DnsRecord).filter(DnsRecord.hosted_zone_id == zone_id).all()
    record_dicts = []
    for r in records:
        record_dicts.append({
            "name": r.name,
            "type": r.type,
            "ttl": r.ttl,
            "routing_policy": r.routing_policy,
            "records": json.loads(r.records) if r.records else []
        })

    if format == "bind":
        bind_content = generate_bind_zone(zone.name, record_dicts)
        return Response(
            content=bind_content,
            media_type="text/plain",
            headers={"Content-Disposition": f'attachment; filename="{zone.name.rstrip(".")}.zone"'}
        )

    return {
        "zone": {
            "id": zone.id,
            "name": zone.name,
            "type": zone.type,
            "comment": zone.comment
        },
        "records": record_dicts
    }
