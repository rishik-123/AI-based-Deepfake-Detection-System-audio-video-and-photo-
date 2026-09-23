"""
Deepfake Detection Model Module
Integrates custom trained PyTorch CNN model (deepfake_cnn.pth).
Architecture: DeepfakeCNN (4-block Conv2d + BatchNorm + ReLU + MaxPool, AdaptiveAvgPool2d, Linear classifier)
Supports image and video inference with keyframe extraction and temporal aggregation.
"""

import os
import io
import base64
import logging
from typing import Dict, Any, List, Optional
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import cv2
import numpy as np

# Configure module logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deepfake_model")


# =====================================================================
# 1. CNN MODEL ARCHITECTURE
# 4-block Conv2d + BatchNorm + ReLU + MaxPool + AdaptiveAvgPool2d + Dropout Linear
# =====================================================================
class DeepfakeCNN(nn.Module):
    """
    Custom 4-block Convolutional Neural Network for binary deepfake detection.
    """
    def __init__(self):
        super().__init__()

        self.features = nn.Sequential(
            # Block 1: 3 -> 32 channels
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 2: 32 -> 64 channels
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 3: 64 -> 128 channels
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 4: 128 -> 256 channels
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )

        self.pool = nn.AdaptiveAvgPool2d((1, 1))

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.5),
            nn.Linear(128, 2)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.pool(x)
        x = self.classifier(x)
        return x


# =====================================================================
# 2. MODEL MANAGER & INFERENCE ENGINE
# =====================================================================
class DeepfakeModelManager:
    """
    Manages model loading, device allocation, transforms, and inference for images and videos.
    """
    def __init__(self, model_filename: str = "deepfake_cnn.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[DeepfakeCNN] = None
        self.transform: Optional[transforms.Compose] = None
        self.idx_to_class: Dict[int, str] = {0: "fake", 1: "real"}
        self.input_size: int = 128
        self.model_filename = model_filename
        self._load_model()

    def _resolve_model_path(self) -> str:
        """Dynamically resolve absolute path to backend/models/<filename>."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidate_paths = [
            os.path.join(base_dir, "models", self.model_filename),
            os.path.join(base_dir, self.model_filename),
            os.path.join(os.getcwd(), "backend", "models", self.model_filename),
            os.path.join(os.getcwd(), "models", self.model_filename),
        ]
        for path in candidate_paths:
            if os.path.exists(path):
                return path
        return os.path.join(base_dir, "models", self.model_filename)

    def _load_model(self):
        """Loads trained PyTorch weights and initializes preprocessing transform."""
        model_path = self._resolve_model_path()
        logger.info(f"Loading trained CNN model from: {model_path} (Device: {self.device})")

        if not os.path.exists(model_path):
            logger.warning(f"Model file not found at: {model_path}. Instantiating uninitialized architecture.")
            self.model = DeepfakeCNN()
            self.model.to(self.device)
            self.model.eval()
        else:
            checkpoint = torch.load(model_path, map_location=self.device)
            if isinstance(checkpoint, dict):
                state_dict = checkpoint.get("model_state_dict", checkpoint)
                class_to_idx = checkpoint.get("class_to_idx", {"Fake": 0, "Real": 1})
                self.input_size = checkpoint.get("input_size", 128)
                self.idx_to_class = {v: k.lower() for k, v in class_to_idx.items()}
            else:
                state_dict = checkpoint

            self.model = DeepfakeCNN()
            self.model.load_state_dict(state_dict)
            self.model.to(self.device)
            self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((self.input_size, self.input_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

        logger.info(f"CNN model ready on {self.device}. Class mapping: {self.idx_to_class}")

    def predict_image(self, image_path_or_pil) -> Dict[str, Any]:
        """
        Runs image deepfake detection inference on a file path or PIL Image.
        """
        if self.model is None or self.transform is None:
            self._load_model()

        if isinstance(image_path_or_pil, str):
            with Image.open(image_path_or_pil) as img:
                img_rgb = img.convert("RGB")
                tensor = self.transform(img_rgb)
        elif isinstance(image_path_or_pil, Image.Image):
            img_rgb = image_path_or_pil.convert("RGB")
            tensor = self.transform(img_rgb)
        elif isinstance(image_path_or_pil, np.ndarray):
            img_rgb = Image.fromarray(cv2.cvtColor(image_path_or_pil, cv2.COLOR_BGR2RGB))
            tensor = self.transform(img_rgb)
        else:
            raise ValueError("Input must be a filepath, PIL.Image, or numpy array.")

        tensor = tensor.unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1)
            fake_prob = float(probabilities[0][0].item())
            real_prob = float(probabilities[0][1].item())
            predicted_idx = torch.argmax(probabilities, dim=1).item()

        predicted_class = self.idx_to_class.get(predicted_idx, "unknown")
        confidence = float(probabilities[0][predicted_idx].item() * 100)

        return {
            "prediction": predicted_class,
            "confidence": round(confidence, 2),
            "probabilities": {
                "fake": round(fake_prob * 100, 2),
                "real": round(real_prob * 100, 2)
            },
            "device": str(self.device)
        }

    def predict_video(self, video_path: str, max_frames: int = 30) -> Dict[str, Any]:
        """
        Uniformly extracts keyframes from a video file and evaluates frame-level CNN predictions.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV could not open video container at: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
        duration_sec = total_frames / fps if fps > 0 else 0.0

        if total_frames <= 0:
            cap.release()
            raise ValueError("Video contains 0 decodable frames.")

        # Uniform keyframe indices
        num_samples = min(max_frames, total_frames)
        sample_indices = np.linspace(0, total_frames - 1, num=num_samples, dtype=int)

        frames_data = []
        sample_thumbnails = []  # List of (PIL.Image, frame_idx, timestamp_str, verdict, conf)
        fake_scores = []
        real_scores = []
        fake_frame_count = 0
        real_frame_count = 0

        current_idx = 0
        sample_ptr = 0

        while sample_ptr < len(sample_indices):
            target_frame_idx = sample_indices[sample_ptr]
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            timestamp = target_frame_idx / fps
            timestamp_str = f"{int(timestamp // 60):02d}:{timestamp % 60:04.1f}"

            # Run inference on frame
            frame_pred = self.predict_image(frame)
            pred_label = frame_pred["prediction"]
            conf = frame_pred["confidence"]
            f_prob = frame_pred["probabilities"]["fake"]
            r_prob = frame_pred["probabilities"]["real"]

            fake_scores.append(f_prob)
            real_scores.append(r_prob)

            if pred_label == "fake":
                fake_frame_count += 1
            else:
                real_frame_count += 1

            frame_info = {
                "frame_index": int(target_frame_idx),
                "timestamp_sec": round(timestamp, 2),
                "timestamp_str": timestamp_str,
                "prediction": pred_label,
                "confidence": conf,
                "fake_probability": f_prob,
                "real_probability": r_prob
            }
            frames_data.append(frame_info)

            # Keep 6 representative frame thumbnails for display
            if len(sample_thumbnails) < 6 or sample_ptr % (max(1, len(sample_indices) // 6)) == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_thumb = Image.fromarray(frame_rgb).resize((200, 150))
                buffered = io.BytesIO()
                pil_thumb.save(buffered, format="JPEG", quality=80)
                img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
                sample_thumbnails.append({
                    "thumbnail": f"data:image/jpeg;base64,{img_b64}",
                    "frame_index": int(target_frame_idx),
                    "timestamp_str": timestamp_str,
                    "verdict": pred_label,
                    "confidence": conf
                })

            sample_ptr += 1

        cap.release()

        if len(frames_data) == 0:
            raise ValueError("No frames could be extracted from video.")

        # Temporal Aggregation
        avg_fake_prob = float(np.mean(fake_scores))
        avg_real_prob = float(np.mean(real_scores))
        fake_ratio = fake_frame_count / len(frames_data)

        # Video verdict: fake if avg fake prob >= 50% or >= 40% of frames are fake
        if avg_fake_prob >= 50.0 or fake_ratio >= 0.40:
            overall_verdict = "fake"
            overall_confidence = round(max(avg_fake_prob, fake_ratio * 100), 2)
        else:
            overall_verdict = "real"
            overall_confidence = round(avg_real_prob, 2)

        return {
            "prediction": overall_verdict,
            "confidence": overall_confidence,
            "total_frames_sampled": len(frames_data),
            "video_total_frames": total_frames,
            "duration_seconds": round(duration_sec, 2),
            "fps": round(fps, 1),
            "fake_frames_count": fake_frame_count,
            "real_frames_count": real_frame_count,
            "fake_ratio_percent": round(fake_ratio * 100, 2),
            "average_fake_probability": round(avg_fake_prob, 2),
            "average_real_probability": round(avg_real_prob, 2),
            "frames": frames_data,
            "thumbnails": sample_thumbnails[:6]
        }


# =====================================================================
# 3. GLOBAL SINGLETON INSTANCE
# =====================================================================
model_manager = DeepfakeModelManager()


def predict_image(image_path_or_pil) -> Dict[str, Any]:
    """Public helper for image inference."""
    return model_manager.predict_image(image_path_or_pil)


def predict_video(video_path: str, max_frames: int = 30) -> Dict[str, Any]:
    """Public helper for video inference."""
    return model_manager.predict_video(video_path, max_frames=max_frames)


def get_model_info() -> Dict[str, Any]:
    """Returns runtime model metadata."""
    return {
        "architecture": "DeepfakeCNN (4-Block Conv2d)",
        "input_size": f"{model_manager.input_size}x{model_manager.input_size}",
        "classes": model_manager.idx_to_class,
        "device": str(model_manager.device),
        "status": "ready"
    }