from model import predict_image


IMAGE_PATH = "test.jpg"


result = predict_image(
    IMAGE_PATH
)


print("================================")
print("       DEEPFAKE RESULT")
print("================================")

print(
    "Prediction:",
    result["prediction"].upper()
)

print(
    "Confidence:",
    str(result["confidence"]) + "%"
)