import os
import pytest
import redis
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.ratelimit import REDIS_URL

TEST_DB = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL") or "postgresql+psycopg://secbot:secbot_secret@postgres:5432/secbot"

engine = create_engine(TEST_DB)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield

@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def client(db):
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        keys = r.keys("rl:*")
        if keys:
            r.delete(*keys)
    except Exception:
        pass

    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
