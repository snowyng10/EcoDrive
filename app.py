import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

# Load .env file
load_dotenv()

app = Flask(__name__)

# Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ------------------------------------------------------------
# Serve the main page
# ------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


# ------------------------------------------------------------
# (Optional) ML model loader — auto-detects .pkl files
# Safe to leave empty for now — the app runs fine without models
# ------------------------------------------------------------
ML_READY = False

def load_ml_models():
    """Try to load ML models if present. Does not crash if missing."""
    global ML_READY
    try:
        import joblib
        import pandas as pd
        MODELS = {
            "consumption": "consumption_model.pkl",
            "cause":       "cause_model.pkl",
            "iso_forest":  "iso_forest.pkl"
        }
        for name, fname in MODELS.items():
            if os.path.exists(fname):
                globals()[f"{name}_model"] = joblib.load(fname)
                print(f"✅ Loaded {fname}")
                ML_READY = True
        if not ML_READY:
            print("ℹ️  No ML models found — running in LLM-only mode.")
    except ImportError:
        print("ℹ️  scikit-learn / joblib not installed — LLM-only mode.")

load_ml_models()


# ------------------------------------------------------------
# Unified /predict endpoint
# Works TODAY without ML models (returns only AI advice)
# Auto-upgrades later when .pkl files are added
# ------------------------------------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}

    # Journey context
    car_name   = data.get("carName", "your car")
    distance   = float(data.get("distance", 0))
    litres     = float(data.get("litres", 0))
    latest     = float(data.get("latest", 0))
    baseline   = float(data.get("baseline", 0))
    difference = float(data.get("difference", 0))
    condition  = data.get("condition", "normal")
    fuel_type  = data.get("fuelType", "RON 95")
    subsidised = data.get("subsidised", False)
    extra_cost = float(data.get("extraCost", 0))
    is_first   = data.get("isFirstLog", False)

    # ---- Optional ML predictions (skipped if models not loaded) ----
    predicted_cause = None
    predicted_l100  = None
    anomaly_score   = None
    is_anomaly      = False

    if ML_READY:
        try:
            import pandas as pd
            row = pd.DataFrame([{
                "car_type":      data.get("car_type", "sedan"),
                "car_condition": data.get("car_condition", "good"),
                "purpose":       data.get("purpose", "commuting"),
                "trip_type":     data.get("trip_type", "mixed"),
                "traffic":       data.get("traffic", "sometimes"),
                "style":         data.get("style", "smooth"),
                "idling":        data.get("idling", "medium"),
                "condition":     condition,
                "engine_cc":     int(data.get("engine_cc", 1500)),
                "year":          int(data.get("year", 2020)),
                "distance":      distance
            }])
            predicted_l100 = float(consumption_model.predict(row)[0])
            if iso_forest_model is not None:
                anomaly_score = float(iso_forest_model.score_samples([[predicted_l100]])[0])
                is_anomaly = anomaly_score < -0.05
            if cause_model is not None and difference >= 15:
                predicted_cause = cause_model.predict(row)[0]
        except Exception as e:
            print(f"[ML] Prediction failed: {e}")

    # ---- Build LLM context ----
    context_parts = []
    if is_first:
        context_parts.append(
            f"This is the user's FIRST log for {car_name}. "
            f"Consumption was {latest:.1f} L/100km."
        )
    elif difference >= 15:
        context_parts.append(
            f"ALERT: {car_name}'s consumption jumped to {latest:.1f} L/100km, "
            f"{difference:.1f}% above their usual {baseline:.1f} L/100km. "
            f"Extra cost on this journey: RM {extra_cost:.2f}."
        )
    else:
        context_parts.append(
            f"{car_name}'s consumption was {latest:.1f} L/100km, "
            f"around their usual {baseline:.1f} L/100km. All good."
        )

    if predicted_cause and predicted_cause != "none":
        context_parts.append(
            f"Our ML model predicts the most likely cause is: {predicted_cause}."
        )

    # ---- Call Groq LLM ----
    ai_advice = None
    if client:
        prompt = f"""You are EcoDrive AI, a warm Malaysian fuel-saving coach.

Context: {' '.join(context_parts)}
Driving conditions reported: {condition}
Fuel type: {fuel_type}{' (subsidised)' if subsidised else ''}

Write ONE short paragraph (45-70 words) that:
1. Reacts to the situation (celebrate if normal/first, gently warn if abnormal)
2. Gives ONE specific, practical tip with a Malaysian context (e.g. "idling at the mamak", "traffic on the LDP")
3. Sounds like a friendly mentor, not a robot
4. No bullet points, no markdown, no emojis, no greeting.

Just the paragraph."""

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=180
            )
            ai_advice = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Groq Error] {e}")

    return jsonify({
        "ai_advice":       ai_advice,
        "predicted_cause": predicted_cause,
        "predicted_l100":  predicted_l100,
        "anomaly_score":   anomaly_score,
        "is_anomaly":      is_anomaly,
        "ml_ready":        ML_READY
    })


# ------------------------------------------------------------
# Run
# ------------------------------------------------------------
if __name__ == "__main__":
    if not GROQ_API_KEY:
        print("⚠️  WARNING: GROQ_API_KEY not found in .env file!")
    else:
        print("✅ GROQ_API_KEY loaded successfully.")
    print(f"🧠 ML mode: {'ON' if ML_READY else 'OFF (LLM only)'}")
    app.run(debug=True, port=5000)