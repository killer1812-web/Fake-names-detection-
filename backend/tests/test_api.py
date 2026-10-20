import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "database" in data
    assert "model_manager" in data

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "quality_pass_rate" in data

def test_dashboard_trends():
    response = client.get("/api/dashboard/trends")
    assert response.status_code == 200
    data = response.json()
    assert "trends" in data
    assert "review_status_distribution" in data

def test_list_records():
    response = client.get("/api/records?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)

def test_single_record_analysis():
    payload = {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone": "000-000-0000",
        "city": "Metropolis",
        "save_to_database": False
    }
    response = client.post("/api/records/analyze-single", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["validation_status"] in ("FLAGGED", "INVALID_FORMAT")
    assert len(data["data_quality_signals"]) > 0

def test_single_valid_record_analysis():
    payload = {
        "full_name": "Elena Rostova",
        "email": "elena.rostova@gmail.com",
        "phone": "+1-202-555-0184",
        "city": "Seattle",
        "save_to_database": False
    }
    response = client.post("/api/records/analyze-single", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["validation_status"] == "VALID"

def test_analytics_overview():
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "missing_values" in data
    assert "name_length_distribution" in data

def test_analytics_duplicates():
    response = client.get("/api/analytics/duplicates")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data

def test_model_status():
    response = client.get("/api/models/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_trained" in data

def test_model_metrics():
    response = client.get("/api/models/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "runs" in data

def test_reviews_list():
    response = client.get("/api/reviews")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_reports_export_json():
    response = client.get("/api/reports/export?format=json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

def test_reports_export_csv():
    response = client.get("/api/reports/export?format=csv")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
