from typing import Any

from fastapi.testclient import TestClient

import routes.inference as inference_route

from config.upload_config import (
    MAX_REQUEST_BODY_SIZE_BYTES,
    MAX_UPLOAD_SIZE_BYTES,
)


def create_fake_prediction_result(
    *,
    model_id: str,
    confidence: float,
) -> dict[str, Any]:
    """
    สร้างผลลัพธ์จำลองที่มีโครงสร้าง
    เหมือน predict_image() ของจริง
    """

    return {
        "model_id": model_id,
        "device": "cpu",
        "image_width": 32,
        "image_height": 24,
        "confidence_threshold": confidence,
        "object_count": 1,
        "detections": [
            {
                "class_id": 0,
                "class_name": "person",
                "confidence": 0.9123,
                "bounding_box": {
                    "x1": 2.0,
                    "y1": 3.0,
                    "x2": 20.0,
                    "y2": 22.0,
                },
            }
        ],
        "result_image_filename": (
            "test-result.jpg"
        ),
    }


def test_predict_success(
    client: TestClient,
    sample_png_bytes: bytes,
    monkeypatch,
) -> None:
    """
    ตรวจเส้นทาง Predict ที่สำเร็จ

    ใช้ Fake predict_image เพื่อไม่ให้:
    - โหลด YOLO
    - ใช้ GPU
    - บันทึกรูปจริง
    """

    def fake_predict_image(
        *,
        model_id: str,
        image_bytes: bytes,
        confidence: float,
        use_sahi: bool = False,
    ) -> dict[str, Any]:
        assert model_id == "rtdetr-l"
        assert confidence == 0.25
        assert use_sahi is False
        assert len(image_bytes) > 0

        return create_fake_prediction_result(
            model_id=model_id,
            confidence=confidence,
        )

    monkeypatch.setattr(
        inference_route,
        "predict_image",
        fake_predict_image,
    )

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 200

    response_data = response.json()

    assert response_data["message"] == (
        "Prediction completed successfully"
    )

    assert (
        response_data["filename"]
        == "sample.png"
    )

    assert (
        response_data["content_type"]
        == "image/png"
    )

    assert (
        response_data["upload_size_bytes"]
        == len(sample_png_bytes)
    )

    assert (
        response_data["model_id"]
        == "rtdetr-l"
    )

    assert (
        response_data[
            "confidence_threshold"
        ]
        == 0.25
    )

    assert (
        response_data["object_count"]
        == 1
    )

    assert (
        len(response_data["detections"])
        == 1
    )

    assert (
        response_data[
            "detections"
        ][0]["class_name"]
        == "person"
    )

    assert response_data[
        "result_image_url"
    ].endswith(
        "/results/test-result.jpg"
    )


def test_predict_unknown_model(
    client: TestClient,
    sample_png_bytes: bytes,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "unknown-model",
            "confidence": "0.25",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 404

    response_data = response.json()

    assert "detail" in response_data


def test_predict_confidence_above_one(
    client: TestClient,
    sample_png_bytes: bytes,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "1.5",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 400

    assert response.json() == {
        "detail": (
            "confidence must be "
            "between 0 and 1"
        )
    }


def test_predict_confidence_below_zero(
    client: TestClient,
    sample_png_bytes: bytes,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "-0.1",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 400

    assert response.json() == {
        "detail": (
            "confidence must be "
            "between 0 and 1"
        )
    }


def test_predict_unsupported_content_type(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "document.pdf",
                b"This is not an image",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 415

    response_data = response.json()

    assert (
        "Unsupported image content type"
        in response_data["detail"]
    )


def test_predict_fake_jpeg(
    client: TestClient,
) -> None:
    """
    MIME type บอกว่าเป็น JPEG
    แต่ข้อมูลข้างในเป็น Text
    """

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "fake.jpg",
                b"This is not JPEG data",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 400

    assert response.json() == {
        "detail": (
            "Uploaded data is not a valid "
            "JPEG, PNG, or WebP image"
        )
    }


def test_predict_empty_upload(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "empty.png",
                b"",
                "image/png",
            )
        },
    )

    assert response.status_code == 400

    assert response.json() == {
        "detail": (
            "Uploaded image is empty"
        )
    }


def test_predict_file_above_upload_limit(
    client: TestClient,
) -> None:
    """
    ใหญ่กว่า File limit 10 MiB
    แต่ยังไม่เกิน Request limit 12 MiB

    จึงควรถูก read_upload_bytes()
    ปฏิเสธ
    """

    oversized_file = (
        b"x"
        * (MAX_UPLOAD_SIZE_BYTES + 1)
    )

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "large.jpg",
                oversized_file,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413

    assert response.json() == {
        "detail": (
            "Uploaded image exceeds "
            "the 10 MB size limit"
        )
    }


def test_predict_request_above_body_limit(
    client: TestClient,
) -> None:
    """
    Request มีขนาดมากกว่า 12 MiB

    ต้องถูก RequestBodyLimitMiddleware
    ปฏิเสธก่อนถึง Route
    """

    oversized_body = (
        b"x"
        * (
            MAX_REQUEST_BODY_SIZE_BYTES
            + 1024
        )
    )

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
        files={
            "file": (
                "huge.jpg",
                oversized_body,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 413

    assert response.json() == {
        "detail": (
            "Request body exceeds "
            "the 12 MiB limit"
        )
    }


def test_predict_missing_file(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
        },
    )

    assert response.status_code == 422

    response_data = response.json()

    assert "detail" in response_data
    assert isinstance(
        response_data["detail"],
        list,
    )

def test_predict_success_with_sahi(
    client: TestClient,
    sample_png_bytes: bytes,
    monkeypatch,
) -> None:
    """ส่ง use_sahi=true แล้ว flag ต้องถูกส่งต่อไปยัง predict_image."""

    def fake_predict_image(
        *,
        model_id: str,
        image_bytes: bytes,
        confidence: float,
        use_sahi: bool = False,
    ) -> dict[str, Any]:
        assert use_sahi is True

        result = create_fake_prediction_result(
            model_id=model_id,
            confidence=confidence,
        )
        result["used_sahi"] = True
        return result

    monkeypatch.setattr(
        inference_route,
        "predict_image",
        fake_predict_image,
    )

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
            "use_sahi": "true",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["used_sahi"] is True


def test_predict_sahi_unavailable(
    client: TestClient,
    sample_png_bytes: bytes,
    monkeypatch,
) -> None:
    """ถ้า SAHI ใช้ไม่ได้ ต้องได้ 503 พร้อมข้อความชัดเจน."""
    from services.yolo_service import (
        SahiUnavailableError,
    )

    def fake_predict_image(**_kwargs):
        raise SahiUnavailableError(
            "SAHI is not installed"
        )

    monkeypatch.setattr(
        inference_route,
        "predict_image",
        fake_predict_image,
    )

    response = client.post(
        "/api/predict",
        data={
            "model_id": "rtdetr-l",
            "confidence": "0.25",
            "use_sahi": "true",
        },
        files={
            "file": (
                "sample.png",
                sample_png_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 503
    assert "SAHI" in response.json()["detail"]
