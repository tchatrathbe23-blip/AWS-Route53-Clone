from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# User / Auth Schemas
class UserLogin(BaseModel):
    username: str
    password: str
    account_id: Optional[str] = "123456789012"

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    account_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# DNS Record Schemas
class DnsRecordBase(BaseModel):
    name: str = Field(..., description="Record name/subdomain e.g. api or mail.example.com")
    type: str = Field(..., description="A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA")
    ttl: int = Field(300, description="TTL in seconds")
    routing_policy: str = Field("Simple", description="Simple, Weighted, Latency, Failover, Geolocation")
    weight: Optional[int] = None
    health_check_id: Optional[str] = None
    is_alias: bool = False
    alias_target: Optional[str] = None
    records: List[str] = Field(..., description="List of record values")

class DnsRecordCreate(DnsRecordBase):
    pass

class DnsRecordUpdate(BaseModel):
    ttl: Optional[int] = None
    routing_policy: Optional[str] = None
    weight: Optional[int] = None
    records: Optional[List[str]] = None
    is_alias: Optional[bool] = None
    alias_target: Optional[str] = None

class DnsRecordOut(BaseModel):
    id: str
    hosted_zone_id: str
    name: str
    type: str
    ttl: int
    routing_policy: str
    weight: Optional[int] = None
    health_check_id: Optional[str] = None
    is_alias: bool
    alias_target: Optional[str] = None
    records: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Hosted Zone Schemas
class HostedZoneCreate(BaseModel):
    name: str = Field(..., description="Domain name e.g. example.com")
    type: str = Field("Public hosted zone", description="Public hosted zone | Private hosted zone")
    comment: Optional[str] = Field(None, description="Description or note")
    vpc_id: Optional[str] = None
    vpc_region: Optional[str] = None

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = None

class HostedZoneOut(BaseModel):
    id: str
    name: str
    type: str
    comment: Optional[str] = None
    vpc_id: Optional[str] = None
    vpc_region: Optional[str] = None
    record_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HostedZoneDetail(HostedZoneOut):
    records: List[DnsRecordOut] = []

# Bulk & Import / Export Schemas
class BulkDeleteRecords(BaseModel):
    record_ids: List[str]

class BulkDeleteHostedZones(BaseModel):
    zone_ids: List[str]

class ZoneImportResponse(BaseModel):
    message: str
    zone_id: str
    imported_records_count: int
