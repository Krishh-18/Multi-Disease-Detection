import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from flask import Flask, render_template, request, jsonify
import numpy as np
from PIL import Image
import io
import tf_keras as keras
from tf_keras.models import load_model
from tf_keras.applications import VGG16
from tf_keras.preprocessing.image import img_to_array
import joblib
import pandas as pd

app = Flask(__name__, static_folder="static", template_folder="templates")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

brain_model = None
lung_model = None
liver_model = None




# ---------------- BUILD ARCHITECTURES ----------------
def build_brain_model():
    model = keras.Sequential([
        keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(150,150,3)),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Conv2D(64, (3,3), activation='relu'),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Conv2D(128, (3,3), activation='relu'),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Flatten(),
        keras.layers.Dense(512, activation='relu'),
        keras.layers.Dense(4, activation='softmax')
    ])
    return model

def build_lung_model():
    base_model = VGG16(weights=None, include_top=False, input_shape=(224,224,3))
    base_model.trainable = False
    model = keras.Sequential([
        base_model,
        keras.layers.Flatten(),
        keras.layers.Dense(256, activation='relu'),
        keras.layers.Dropout(0.5),
        keras.layers.Dense(3, activation='softmax')
    ])
    return model


# ---------------- LOAD MODELS ----------------
def load_models():
    global brain_model, lung_model, liver_model  # ✅ all three declared global

    # Brain
    brain_fixed = os.path.join(MODEL_DIR, "brain_fixed.h5")
    try:
        if os.path.exists(brain_fixed):
            brain_model = load_model(brain_fixed, compile=False)
        else:
            brain_model = build_brain_model()
            brain_model.load_weights(os.path.join(MODEL_DIR, "brain_tumor_model.h5"), by_name=True, skip_mismatch=True)
            brain_model.save(brain_fixed)
        print("✅ Brain model loaded")
    except Exception as e:
        print("❌ Brain model failed:", str(e))
        brain_model = None

    # Lung
    lung_fixed = os.path.join(MODEL_DIR, "lung_fixed.h5")
    try:
        if os.path.exists(lung_fixed):
            lung_model = load_model(lung_fixed, compile=False)
        else:
            lung_model = build_lung_model()
            lung_model.load_weights(os.path.join(MODEL_DIR, "lung_cancer_vgg16_model.keras"), by_name=True, skip_mismatch=True)
            lung_model.save(lung_fixed)
        print("✅ Lung model loaded")
    except Exception as e:
        print("❌ Lung model failed:", str(e))
        lung_model = None

    # Liver
    try:
        liver_model = joblib.load(os.path.join(MODEL_DIR, "liver_cirrhosis_model.pkl"))
        print("✅ Liver model loaded")
    except Exception as e:
        print("❌ Liver model failed:", str(e))
        liver_model = None


# ---------------- IMAGE PREPROCESS ----------------
def preprocess_image_bytes(img_bytes, target_size):
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    image = image.resize(target_size)
    arr = img_to_array(image)
    arr = arr.astype("float32") / 255.0
    return np.expand_dims(arr, axis=0)


# ---------------- ROUTES ----------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    disease = request.form.get("disease")

    if not disease:
        return jsonify({"error": "No disease specified"}), 400

    # Brain
    if disease == "brain":
        if brain_model is None:
            return jsonify({"error": "Brain model not loaded"}), 500
        if "file" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        try:
            img = preprocess_image_bytes(request.files["file"].read(), (150, 150))
            pred = brain_model.predict(img)
            prob = float(np.max(pred))
            idx = int(np.argmax(pred))
            classes = ["Benign", "Malignant", "Normal", "Metastatic"]
            return jsonify({
                "disease": "Brain Tumor",
                "prediction": classes[idx],
                "confidence": round(prob * 100, 2)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Lung
    elif disease == "lung":
        if lung_model is None:
            return jsonify({"error": "Lung model not loaded"}), 500
        if "file" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
        try:
            img = preprocess_image_bytes(request.files["file"].read(), (224, 224))
            pred = lung_model.predict(img)
            prob = float(np.max(pred))
            idx = int(np.argmax(pred))
            classes = ["Normal", "Benign", "Malignant"]
            return jsonify({
                "disease": "Lung Cancer",
                "prediction": classes[idx],
                "confidence": round(prob * 100, 2)
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Liver
    elif disease == "liver":
        if liver_model is None:
            return jsonify({"error": "Liver model not loaded"}), 500
        try:
            status_map = {'C': 0, 'CL': 1, 'D': 2}
            drug_map   = {'Placebo': 0, 'Prednisone': 1, 'Prednisolone': 2}
            sex_map    = {'M': 1, 'F': 0}
            binary_map = {'N': 0, 'Y': 1}

            def flt(key, default=0.0):
                v = request.form.get(key)
                try: return float(v)
                except: return default

            X = pd.DataFrame([{
                "N_Days":        flt("N_Days"),
                "Status":        status_map.get(request.form.get("Status", "C"), 0),
                "Drug":          drug_map.get(request.form.get("Drug", "Placebo"), 0),
                "Sex":           sex_map.get(request.form.get("Sex", "F"), 0),
                "Ascites":       binary_map.get(request.form.get("Ascites", "N"), 0),
                "Hepatomegaly":  binary_map.get(request.form.get("Hepatomegaly", "N"), 0),
                "Spiders":       binary_map.get(request.form.get("Spiders", "N"), 0),
                "Edema":         binary_map.get(request.form.get("Edema", "N"), 0),
                "Bilirubin":     flt("Bilirubin"),
                "Cholesterol":   flt("Cholesterol"),
                "Albumin":       flt("Albumin"),
                "Copper":        flt("Copper"),
                "Alk_Phos":      flt("Alk_Phos"),
                "SGOT":          flt("SGOT"),
                "Tryglicerides": flt("Tryglicerides"),
                "Platelets":     flt("Platelets"),
                "Prothrombin":   flt("Prothrombin"),
                "Age_years":     flt("Age"),
            }])

            try:
                prob = float(np.max(liver_model.predict_proba(X)))
            except:
                prob = 0.0

            label = int(liver_model.predict(X)[0])
            stage_map = {1: "Stage 1 (Mild)", 2: "Stage 2 (Moderate)", 3: "Stage 3 (Severe)"}

            return jsonify({
                "disease": "Liver Cirrhosis",
                "prediction": stage_map.get(label, f"Stage {label}"),
                "confidence": round(prob * 100, 2)
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Fallback ✅ now correctly outside all if/elif blocks
    else:
        return jsonify({"error": f"'{disease}' prediction not available yet"}), 400


if __name__ == "__main__":
    load_models()
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)