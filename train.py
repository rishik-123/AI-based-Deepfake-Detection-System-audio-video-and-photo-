"""
Training Pipeline for Deepfake Detection System
Trains DeepfakeCNN on extracted video frames & images.
Saves the optimized model to backend/models/deepfake_cnn.pth.
"""

import os
import sys
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image

# Optimize CPU threads for fast training
torch.set_num_threads(os.cpu_count() or 4)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE} (CPU Cores: {os.cpu_count()})", flush=True)

# Architecture
class DeepfakeCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

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

class FrameDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        with Image.open(img_path) as img:
            img_rgb = img.convert("RGB")
        if self.transform:
            img_tensor = self.transform(img_rgb)
        else:
            img_tensor = transforms.ToTensor()(img_rgb)
        return img_tensor, label

def load_dataset_samples(frames_root):
    samples = []
    class_to_idx = {"Fake": 0, "Real": 1}
    for class_name, label in class_to_idx.items():
        class_dir = os.path.join(frames_root, class_name)
        if not os.path.exists(class_dir):
            continue
        for fname in os.listdir(class_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                samples.append((os.path.join(class_dir, fname), label))
    return samples, class_to_idx

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frames_dir = os.path.join(base_dir, "dataset", "frames")
    output_model_dir = os.path.join(base_dir, "backend", "models")
    os.makedirs(output_model_dir, exist_ok=True)
    output_model_path = os.path.join(output_model_dir, "deepfake_cnn.pth")

    samples, class_to_idx = load_dataset_samples(frames_dir)
    print(f"Loaded {len(samples)} total frame samples: {sum(1 for _, l in samples if l == 0)} Fake, {sum(1 for _, l in samples if l == 1)} Real", flush=True)
    
    random.shuffle(samples)
    train_size = int(0.8 * len(samples))
    train_samples = samples[:train_size]
    val_samples = samples[train_size:]
    print(f"Train samples: {len(train_samples)} | Validation samples: {len(val_samples)}", flush=True)

    train_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dataset = FrameDataset(train_samples, transform=train_transform)
    val_dataset = FrameDataset(val_samples, transform=val_transform)

    batch_size = 32
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

    model = DeepfakeCNN().to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=2)

    epochs = 12
    best_val_acc = 0.0
    best_state_dict = None

    print(f"\n--- Training DeepfakeCNN ({epochs} Epochs) ---", flush=True)
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for images, labels in train_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct_train += torch.sum(preds == labels.data).item()
            total_train += labels.size(0)

        epoch_train_loss = running_loss / total_train
        epoch_train_acc = (correct_train / total_train) * 100.0

        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(DEVICE), labels.to(DEVICE)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                correct_val += torch.sum(preds == labels.data).item()
                total_val += labels.size(0)

        epoch_val_loss = val_loss / total_val
        epoch_val_acc = (correct_val / total_val) * 100.0
        scheduler.step(epoch_val_acc)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] "
              f"Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.2f}%", flush=True)

        if epoch_val_acc >= best_val_acc or best_state_dict is None:
            best_val_acc = epoch_val_acc
            best_state_dict = model.state_dict().copy()

    print(f"\nTraining Complete! Best Validation Accuracy: {best_val_acc:.2f}%", flush=True)

    checkpoint = {
        "model_state_dict": best_state_dict,
        "class_to_idx": class_to_idx,
        "input_size": 128,
        "best_val_accuracy": best_val_acc,
        "epochs": epochs,
        "architecture": "DeepfakeCNN (4-Block Conv2d)"
    }
    torch.save(checkpoint, output_model_path)
    print(f"Saved trained model checkpoint to: {output_model_path}", flush=True)
    print(f"File size: {os.path.getsize(output_model_path):,} bytes", flush=True)

if __name__ == "__main__":
    main()
