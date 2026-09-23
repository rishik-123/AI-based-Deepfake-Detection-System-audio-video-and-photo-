import os
import io
import sys
from PIL import Image
import numpy as np
from fastapi.testclient import TestClient

from main import app, UPLOAD_DIR

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("FASTAPI BACKEND ENDPOINTS & PREDICTION TEST")
    print("=" * 60)

    # 1. Test GET /
    print("[1/5] Testing GET / ...")
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"      Response: {res.json()}")

    # 2. Test GET /health
    print("[2/5] Testing GET /health ...")
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data.get("status") == "healthy", f"Unexpected health status: {data}"
    print(f"      Response: {data}")

    # 3. Test GET /model-info
    print("[3/5] Testing GET /model-info ...")
    res = client.get("/model-info")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"      Response: {res.json()}")

    # 4. Test POST /predict with a valid sample image
    print("[4/5] Testing POST /predict with valid JPEG image...")
    # Generate an in-memory sample RGB image
    img_data = np.random.randint(0, 256, (128, 128, 3), dtype=np.uint8)
    pil_img = Image.fromarray(img_data)
    img_byte_arr = io.BytesIO()
    pil_img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    files = {"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
    res = client.post("/predict", files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    predict_data = res.json()
    print(f"      Prediction Response: {predict_data}")
    assert "filename" in predict_data
    assert "prediction" in predict_data
    assert "confidence" in predict_data
    assert predict_data["prediction"] in ["fake", "real"]
    assert isinstance(predict_data["confidence"], (int, float))

    # 5. Verify temporary upload folder cleanup
    print("[5/5] Verifying temporary upload folder cleanup...")
    upload_files = os.listdir(UPLOAD_DIR)
    print(f"      Files in uploads directory: {upload_files}")
    assert len(upload_files) == 0, f"Temporary files were not cleaned up: {upload_files}"

    print("\n" + "=" * 60)
    print("ALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
