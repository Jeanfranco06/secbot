def test_rate_limit_login(client):
    for _ in range(5):
        client.post("/api/v1/auth/login", json={"email": "x@x.x", "password": "y"})
    r = client.post("/api/v1/auth/login", json={"email": "x@x.x", "password": "y"})
    assert r.status_code == 429