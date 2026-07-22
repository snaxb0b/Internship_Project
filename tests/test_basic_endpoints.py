from fastapi.testclient import TestClient


def test_root_endpoint(
    client: TestClient,
) -> None:
    response = client.get("/")

    assert response.status_code == 200

    assert response.json() == {
        "message": (
            "YOLO Image Prediction API "
            "is running"
        )
    }


def test_health_endpoint(
    client: TestClient,
) -> None:
    response = client.get("/health")

    assert response.status_code == 200

    assert response.json() == {
        "status": "healthy"
    }


def test_models_endpoint(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/models"
    )

    assert response.status_code == 200

    response_data = response.json()

    assert "models" in response_data

    models = response_data["models"]

    assert isinstance(models, list)

    expected_model_ids = {
        "yolo26n",
        "yolo26s",
        "yolo26m",
        "yolo26l",
        "yolo26x",
    }

    model_ids = {
        model["id"]
        for model in models
    }

    assert model_ids == (
        expected_model_ids
    )

    assert len(models) == 5

    for model in models:
        assert isinstance(
            model["id"],
            str,
        )

        assert model["id"]

        assert isinstance(
            model["name"],
            str,
        )

        assert model["name"]

        assert isinstance(
            model["description"],
            str,
        )

        assert model["description"]