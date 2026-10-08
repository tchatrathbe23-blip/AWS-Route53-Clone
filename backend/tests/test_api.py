from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={"username": "testuser", "password": "password123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "testuser"

def test_create_and_get_hosted_zone():
    res = client.post("/api/v1/hosted-zones", json={
        "name": "mytestzone.net",
        "type": "Public hosted zone",
        "comment": "Test Zone"
    })
    assert res.status_code == 201
    zone = res.json()
    assert zone["name"] == "mytestzone.net."
    zone_id = zone["id"]

    # Get zone
    get_res = client.get(f"/api/v1/hosted-zones/{zone_id}")
    assert get_res.status_code == 200
    details = get_res.json()
    assert len(details["records"]) == 2 # Default NS & SOA

def test_create_and_validate_record():
    # 1. Create a zone
    z_res = client.post("/api/v1/hosted-zones", json={
        "name": "validationzone.org",
        "type": "Public hosted zone"
    })
    zone_id = z_res.json()["id"]

    # 2. Add valid A record
    r_res = client.post(f"/api/v1/records/zone/{zone_id}", json={
        "name": "web",
        "type": "A",
        "ttl": 300,
        "routing_policy": "Simple",
        "records": ["192.168.1.1"]
    })
    assert r_res.status_code == 201
    assert r_res.json()["name"] == "web.validationzone.org."

    # 3. Add invalid A record
    bad_res = client.post(f"/api/v1/records/zone/{zone_id}", json={
        "name": "bad",
        "type": "A",
        "ttl": 300,
        "records": ["999.999.999.999"]
    })
    assert bad_res.status_code == 400
