# Seed sample data for testing and demonstration
from app.core.database import SessionLocal, Base, engine
from app.models.models import User, HostedZone, DnsRecord
from app.core.security import get_password_hash
import json

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Check or create User
    if not db.query(User).filter(User.username == "admin").first():
        user = User(
            username="admin",
            email="admin@scaler-labs.aws",
            account_id="948123049581",
            hashed_password=get_password_hash("password123")
        )
        db.add(user)

    # 2. Check or create sample Hosted Zones
    if db.query(HostedZone).count() == 0:
        zone1 = HostedZone(
            name="scaler-labs.internal.",
            type="Private hosted zone",
            comment="Private enterprise DNS for Scaler Labs microservices",
            vpc_id="vpc-0a1b2c3d4e5f67890",
            vpc_region="us-east-1",
            record_count=4
        )
        zone2 = HostedZone(
            name="cloud-native-app.io.",
            type="Public hosted zone",
            comment="Production public zone for web services",
            record_count=5
        )
        db.add(zone1)
        db.add(zone2)
        db.flush()

        # Seed records for zone 1
        db.add_all([
            DnsRecord(
                hosted_zone_id=zone1.id,
                name="scaler-labs.internal.",
                type="NS",
                ttl=172800,
                records=json.dumps(["ns-1024.awsdns-00.org.", "ns-512.awsdns-00.net."])
            ),
            DnsRecord(
                hosted_zone_id=zone1.id,
                name="scaler-labs.internal.",
                type="SOA",
                ttl=900,
                records=json.dumps(["ns-1024.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"])
            ),
            DnsRecord(
                hosted_zone_id=zone1.id,
                name="api.scaler-labs.internal.",
                type="A",
                ttl=300,
                records=json.dumps(["10.0.1.50", "10.0.1.51"])
            ),
            DnsRecord(
                hosted_zone_id=zone1.id,
                name="db.scaler-labs.internal.",
                type="CNAME",
                ttl=60,
                records=json.dumps(["rds-cluster.internal.amazonaws.com"])
            )
        ])

        # Seed records for zone 2
        db.add_all([
            DnsRecord(
                hosted_zone_id=zone2.id,
                name="cloud-native-app.io.",
                type="NS",
                ttl=172800,
                records=json.dumps(["ns-1024.awsdns-00.org.", "ns-512.awsdns-00.net."])
            ),
            DnsRecord(
                hosted_zone_id=zone2.id,
                name="cloud-native-app.io.",
                type="SOA",
                ttl=900,
                records=json.dumps(["ns-1024.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"])
            ),
            DnsRecord(
                hosted_zone_id=zone2.id,
                name="cloud-native-app.io.",
                type="A",
                ttl=300,
                records=json.dumps(["198.51.100.25", "198.51.100.26"])
            ),
            DnsRecord(
                hosted_zone_id=zone2.id,
                name="mail.cloud-native-app.io.",
                type="MX",
                ttl=3600,
                records=json.dumps(["10 inbound-smtp.us-east-1.amazonaws.com."])
            ),
            DnsRecord(
                hosted_zone_id=zone2.id,
                name="cloud-native-app.io.",
                type="TXT",
                ttl=300,
                records=json.dumps(["v=spf1 include:amazonses.com ~all"])
            )
        ])

        db.commit()
    db.close()
    print("Seed complete!")

if __name__ == "__main__":
    seed()
