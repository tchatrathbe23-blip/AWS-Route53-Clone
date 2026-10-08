import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_zone_id():
    # AWS Hosted Zone ID format: Z + 12-14 alphanumeric chars uppercase
    return "Z" + uuid.uuid4().hex[:13].upper()

def generate_record_id():
    return "rec_" + uuid.uuid4().hex[:16]

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    account_id = Column(String, default="123456789012")
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=generate_zone_id)
    name = Column(String, index=True, nullable=False) # e.g. "example.com."
    type = Column(String, default="Public hosted zone") # Public hosted zone | Private hosted zone
    comment = Column(Text, nullable=True) # Description
    vpc_id = Column(String, nullable=True) # for private zones
    vpc_region = Column(String, nullable=True)
    record_count = Column(Integer, default=2) # default includes NS & SOA
    caller_reference = Column(String, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    records = relationship("DnsRecord", back_populates="hosted_zone", cascade="all, delete-orphan")

class DnsRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=generate_record_id)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True) # subdomain or full domain e.g. "api.example.com."
    type = Column(String, nullable=False) # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA
    ttl = Column(Integer, default=300) # seconds
    routing_policy = Column(String, default="Simple") # Simple, Weighted, Latency, Failover, Geolocation
    weight = Column(Integer, nullable=True)
    health_check_id = Column(String, nullable=True)
    is_alias = Column(Boolean, default=False)
    alias_target = Column(String, nullable=True)
    records = Column(Text, nullable=False) # multiline string or JSON array of record values
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
