"""
FastAPI Backend Application
Deepfake Detection and Media Authenticity Detection System
Provides REST API endpoints for CNN model inference and health checks.
"""

import os
import uuid
import logging
from typing import Dict, Any
from PIL import Image
import io

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model import predict_image, predict_video, get_model_info

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deepfake_api")

# Initialize FastAPI App
app = FastAPI(
    title="Deepfake Detection and Media Authenticity API",
    description="Backend API powered by a custom PyTorch CNN model for media authenticity detection.",
    version="1.0.0"
)

# Configure CORS Middleware with broad local allowance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =====================================================================
# ENDPOINTS
# =====================================================================

@app.get("/")
def home():
    """Root endpoint - service status check."""
    return {
        "status": "online",
        "message": "Deepfake Detection API is running"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    model_info = get_model_info()
    return {
        "status": "healthy",
        "model_loaded": True,
        "device": model_info.get("device", "unknown")
    }


@app.get("/model-info")
def model_details():
    """Returns technical details of the loaded PyTorch CNN."""
    return get_model_info()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Image Deepfake Prediction Endpoint.
    
    Accepts an uploaded image file (multipart/form-data with key 'file'),
    validates the file, performs CNN inference, and cleans up the temporary file.
    
    Returns:
        JSON:
        {
            "filename": "example.jpg",
            "prediction": "fake" | "real",
            "confidence": 94.52
        }
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided in upload request."
        )

    # 1. Read file contents into memory for initial validation
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # 2. Validate that the uploaded file is a valid image using Pillow
    try:
        with Image.open(io.BytesIO(contents)) as test_img:
            test_img.verify()  # Verify image integrity
            img_format = test_img.format
    except Exception as e:
        logger.warning(f"File validation failed for '{file.filename}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The uploaded file is not a valid image format. (Error: {str(e)})"
        )

    # 3. Create temporary file with unique UUID
    extension = os.path.splitext(file.filename)[1]
    if not extension:
        extension = f".{img_format.lower()}" if img_format else ".jpg"

    unique_filename = f"{uuid.uuid4().hex}{extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, unique_filename)

    # Write file to temporary storage
    try:
        with open(temp_filepath, "wb") as temp_file:
            temp_file.write(contents)
    except Exception as e:
        logger.error(f"Failed to write temporary file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server failed to save uploaded image temporarily."
        )

    # 4. Run Model Prediction inside try...finally to ensure cleanup
    try:
        result = predict_image(temp_filepath)
        
        logger.info(
            f"Prediction completed for '{file.filename}': "
            f"Verdict={result['prediction']}, Confidence={result['confidence']}%"
        )

        return {
            "filename": file.filename,
            "prediction": result["prediction"],
            "confidence": result["confidence"]
        }

    except Exception as e:
        logger.error(f"Inference error on file '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing deepfake prediction model: {str(e)}"
        )

    finally:
        # 5. Always clean up temporary file
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as clean_err:
                logger.warning(f"Failed to remove temporary file '{temp_filepath}': {clean_err}")


@app.post("/predict/video")
async def predict_video_endpoint(file: UploadFile = File(...)):
    """
    Video Deepfake Prediction Endpoint.
    
    Accepts an uploaded video file (multipart/form-data with key 'file'),
    extracts keyframes using OpenCV, applies CNN inference across frames,
    and returns aggregated temporal authenticity analysis.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video file provided in upload request."
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded video file is empty (0 bytes)."
        )

    extension = os.path.splitext(file.filename)[1] or ".mp4"
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    temp_filepath = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(temp_filepath, "wb") as temp_file:
            temp_file.write(contents)
    except Exception as e:
        logger.error(f"Failed to write temporary video file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server failed to save uploaded video temporarily: {str(e)}"
        )

    try:
        result = predict_video(temp_filepath, max_frames=30)
        result["filename"] = file.filename
        
        logger.info(
            f"Video prediction completed for '{file.filename}': "
            f"Verdict={result['prediction']}, Confidence={result['confidence']}% "
            f"({result['fake_frames_count']}/{result['total_frames_sampled']} fake frames)"
        )
        return result

    except Exception as e:
        logger.error(f"Inference error on video '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing video prediction model: {str(e)}"
        )

    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception as clean_err:
                logger.warning(f"Failed to remove temporary video file '{temp_filepath}': {clean_err}")



# Global error handler for unexpected exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled server exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected internal server error occurred."}
    )