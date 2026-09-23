import os
import sys
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import numpy as np

# ==========================================
# 1. CNN ARCHITECTURE DEFINITION
# ==========================================
class DeepfakeCNN(nn.Module):
    """
    Exact CNN architecture from the training notebook.
    4 Convolutional blocks + AdaptiveAvgPool2d + Classifier
    """
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),

            # Block 2
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),

            # Block 3
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),

            # Block 4
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, 2)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.pool(x)
        x = self.classifier(x)
        return x


def verify():
    print("=" * 60)
    print("INDEPENDENT PYTORCH MODEL VERIFICATION")
    print("=" * 60)

    # 1. Device detection
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[1/5] Compute device selected: {device}")

    # 2. Check model file existence
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "deepfake_cnn.pth")
    if not os.path.exists(model_path):
        print(f"[ERROR] Model file not found at: {model_path}")
        sys.exit(1)
    print(f"[2/5] Model file verified at: {model_path} ({os.path.getsize(model_path):,} bytes)")

    # 3. Load checkpoint and inspect structure
    print("[3/5] Loading checkpoint with torch.load...")
    checkpoint = torch.load(model_path, map_location=device)
    if not isinstance(checkpoint, dict):
        print("[ERROR] Checkpoint is not a dictionary.")
        sys.exit(1)
    
    print(f"      Checkpoint top-level keys: {list(checkpoint.keys())}")
    class_to_idx = checkpoint.get("class_to_idx", {"Fake": 0, "Real": 1})
    input_size = checkpoint.get("input_size", 128)
    print(f"      Stored class_to_idx: {class_to_idx}")
    print(f"      Stored input_size: {input_size}")

    # 4. Instantiate and load state_dict
    print("[4/5] Instantiating DeepfakeCNN and loading weights...")
    model = DeepfakeCNN()
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()
    print("      Model state_dict successfully loaded and set to eval() mode.")

    # 5. Run test inference with exact transform
    print("[5/5] Testing inference with exact transform on sample image...")
    transform = transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    # Invert class_to_idx to get idx_to_class mapping
    # Note: lowercase labels 'fake' and 'real'
    idx_to_class = {v: k.lower() for k, v in class_to_idx.items()}
    print(f"      Resolved index-to-class mapping: {idx_to_class}")

    # Generate synthetic RGB test image
    test_img_path = os.path.join(base_dir, "test_sample.jpg")
    img_data = np.random.randint(0, 256, (256, 256, 3), dtype=np.uint8)
    sample_pil = Image.fromarray(img_data)
    sample_pil.save(test_img_path)

    try:
        # Load and transform image
        img = Image.open(test_img_path).convert("RGB")
        tensor = transform(img).unsqueeze(0).to(device)

        with torch.no_grad():
            output = model(tensor)
            probabilities = torch.softmax(output, dim=1)
            pred_idx = torch.argmax(probabilities, dim=1).item()

        pred_class = idx_to_class.get(pred_idx, "unknown")
        confidence = float(probabilities[0][pred_idx].item() * 100)

        print("\n" + "=" * 60)
        print("VERIFICATION RESULT:")
        print(f"Raw Logits: {output.cpu().numpy().tolist()}")
        print(f"Softmax Probabilities: {probabilities.cpu().numpy().tolist()}")
        print(f"Predicted Class: '{pred_class}'")
        print(f"Confidence: {confidence:.2f}%")
        print("=" * 60)
        print("[SUCCESS] Model loaded and executed successfully without errors!\n")
    finally:
        if os.path.exists(test_img_path):
            os.remove(test_img_path)


if __name__ == "__main__":
    verify()
