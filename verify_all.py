"""
End-to-End Verification Test Script
Tests model loading, image prediction, and video keyframe prediction.
"""

import os
import sys
import torch

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from model import DeepfakeModelManager, predict_image, predict_video, get_model_info

def run_tests():
    print("=" * 60)
    print("1. TESTING MODEL INITIALIZATION & METADATA")
    print("=" * 60)
    
    info = get_model_info()
    print("Model Info:", info)
    assert info["status"] == "ready", "Model status is not ready!"
    print(" [PASSED] Model Loaded Successfully\n")
    
    print("=" * 60)
    print("2. TESTING IMAGE PREDICTION")
    print("=" * 60)
    
    # Test on real image from dataset/raw/image/1.jpg if exists or backend test_image.jpg
    test_img = os.path.join(CURRENT_DIR, "dataset", "raw", "image", "1.jpg")
    if not os.path.exists(test_img):
        test_img = os.path.join(BACKEND_DIR, "test_image.jpg")
        
    print(f"Testing on image: {test_img}")
    img_res = predict_image(test_img)
    print("Image Result:", img_res)
    assert "prediction" in img_res and "confidence" in img_res
    print(" [PASSED] Image Prediction Succeeded\n")
    
    print("=" * 60)
    print("3. TESTING VIDEO PREDICTION & KEYFRAME AGGREGATION")
    print("=" * 60)
    
    # Test on a real video and deepfake video from raw dataset
    df_video = os.path.join(CURRENT_DIR, "dataset", "raw", "deepfake", "1.mp4")
    real_video = os.path.join(CURRENT_DIR, "dataset", "raw", "video", "1.mp4")
    
    if os.path.exists(df_video):
        print(f"\nEvaluating Deepfake Video: {df_video}")
        df_res = predict_video(df_video, max_frames=15)
        print(f"  Verdict: {df_res['prediction'].upper()}")
        print(f"  Confidence: {df_res['confidence']}%")
        print(f"  Sampled frames: {df_res['total_frames_sampled']}")
        print(f"  Fake frames: {df_res['fake_frames_count']} ({df_res['fake_ratio_percent']}%)")
        print(f"  Thumbnails extracted: {len(df_res['thumbnails'])}")
        assert len(df_res["frames"]) > 0
        print(" [PASSED] Deepfake Video Evaluation")
        
    if os.path.exists(real_video):
        print(f"\nEvaluating Real Video: {real_video}")
        real_res = predict_video(real_video, max_frames=15)
        print(f"  Verdict: {real_res['prediction'].upper()}")
        print(f"  Confidence: {real_res['confidence']}%")
        print(f"  Sampled frames: {real_res['total_frames_sampled']}")
        print(f"  Real frames: {real_res['real_frames_count']} (Fake ratio: {real_res['fake_ratio_percent']}%)")
        print(f"  Thumbnails extracted: {len(real_res['thumbnails'])}")
        assert len(real_res["frames"]) > 0
        print(" [PASSED] Real Video Evaluation")

    print("\n" + "=" * 60)
    print("4. TESTING STREAMLIT APP IMPORTS")
    print("=" * 60)
    import streamlit
    import pandas
    import matplotlib
    import altair
    print(f"Streamlit Version: {streamlit.__version__}")
    print(f"Pandas Version: {pandas.__version__}")
    print(f"Matplotlib Version: {matplotlib.__version__}")
    print(" [PASSED] All Streamlit App Dependencies Ready")
    
    print("\n" + "=" * 60)
    print(">>> ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
