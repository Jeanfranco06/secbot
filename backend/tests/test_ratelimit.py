import redis
from app.ratelimit import REDIS_URL

def test_rate_limit_login(client):
    try:
        r_client = redis.from_url(REDIS_URL, decode_responses=True)
        keys = r_client.keys("rl:*")
        if keys:
            r_client.delete(*keys)
    except Exception:
        r_client = None

    for _ in range(5):
        client.post("/api/v1/auth/login", json={"email": "x@x.x", "password": "valid_test_password_123"})
    r = client.post("/api/v1/auth/login", json={"email": "x@x.x", "password": "valid_test_password_123"})
    assert r.status_code == 429

    if r_client:
        try:
            keys = r_client.keys("rl:*")
            if keys:
                r_client.delete(*keys)
        except Exception:
            pass
