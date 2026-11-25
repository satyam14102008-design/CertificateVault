from fastapi.testclient import TestClient


def test_create_certificate_minimal_title_only(client: TestClient, auth_headers: dict[str, str]):
    resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "Minimal Certificate"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Minimal Certificate"
    assert data["category"] == "Other"
    assert data["is_favorite"] is False


def test_create_link_only_certificate_and_crud(client: TestClient, auth_headers: dict[str, str]):
    create_resp = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={
            "title": "Python Specialization",
            "issuer": "Coursera",
            "category": "Courses",
            "issue_date": "2026-10-01",
            "certificate_url": "https://coursera.org/verify/abc123",
            "description": "Completed 5 Python modules.",
            "is_favorite": True,
        },
    )
    assert create_resp.status_code == 201
    created = create_resp.json()
    cert_id = created["id"]

    # Read single
    get_resp = client.get(f"/api/certificates/{cert_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["certificate_url"] == "https://coursera.org/verify/abc123"

    # Update
    put_resp = client.put(
        f"/api/certificates/{cert_id}",
        headers=auth_headers,
        json={"title": "Python Specialization Updated", "is_favorite": False},
    )
    assert put_resp.status_code == 200
    assert put_resp.json()["title"] == "Python Specialization Updated"
    assert put_resp.json()["is_favorite"] is False

    # Delete
    del_resp = client.delete(f"/api/certificates/{cert_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    assert client.get(f"/api/certificates/{cert_id}", headers=auth_headers).status_code == 404


def test_search_filter_sort_and_stats(client: TestClient, auth_headers: dict[str, str]):
    items = [
        {"title": "Alpha Course", "issuer": "Coursera", "category": "Courses", "issue_date": "2025-05-01"},
        {"title": "Beta Hackathon", "issuer": "MLH", "category": "Hackathons", "issue_date": "2026-02-01", "is_favorite": True},
        {"title": "Gamma Course", "issuer": "Google", "category": "Courses", "issue_date": "2026-08-01"},
    ]
    for item in items:
        assert client.post("/api/certificates", headers=auth_headers, json=item).status_code == 201

    res = client.get("/api/certificates?category=Courses&sort=title-desc", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 2
    assert [c["title"] for c in body["items"]] == ["Gamma Course", "Alpha Course"]
    assert body["stats"]["total"] == 3
    assert body["stats"]["favorites"] == 1
    assert body["stats"]["storage_quota_bytes"] > 0
    assert (
        body["stats"]["storage_remaining_bytes"]
        == body["stats"]["storage_quota_bytes"] - body["stats"]["storage_used_bytes"]
    )

    search_res = client.get("/api/certificates?search=Hackathon", headers=auth_headers)
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert search_res.json()["items"][0]["title"] == "Beta Hackathon"


def test_reject_future_date_and_bad_url(client: TestClient, auth_headers: dict[str, str]):
    bad_date = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "Future Cert", "issue_date": "2099-01-01"},
    )
    assert bad_date.status_code == 422

    bad_url = client.post(
        "/api/certificates",
        headers=auth_headers,
        json={"title": "Bad URL", "certificate_url": "javascript:alert(1)"},
    )
    assert bad_url.status_code == 422


def test_export_json_and_csv(client: TestClient, auth_headers: dict[str, str]):
    client.post("/api/certificates", headers=auth_headers, json={"title": "Exportable Cert"})

    json_resp = client.get("/api/certificates/export?format=json", headers=auth_headers)
    assert json_resp.status_code == 200
    assert json_resp.json()["count"] == 1

    csv_resp = client.get("/api/certificates/export?format=csv", headers=auth_headers)
    assert csv_resp.status_code == 200
    assert "Exportable Cert" in csv_resp.text
