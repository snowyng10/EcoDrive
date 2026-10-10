import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ============================================================
# LOAD ML MODELS (optional — safe if files missing)
# ============================================================
ML_READY = False
consumption_model = None
cause_model = None
iso_forest = None

def load_ml_models():
    global ML_READY, consumption_model, cause_model, iso_forest
    try:
        import joblib
        import pandas as pd

        if os.path.exists("consumption_model.pkl"):
            consumption_model = joblib.load("consumption_model.pkl")
            print("✅ Loaded consumption_model.pkl")
        else:
            print("ℹ️  consumption_model.pkl not found — skipping")

        if os.path.exists("cause_model.pkl"):
            cause_model = joblib.load("cause_model.pkl")
            print("✅ Loaded cause_model.pkl")
        else:
            print("ℹ️  cause_model.pkl not found — skipping")

        if os.path.exists("iso_forest.pkl"):
            iso_forest = joblib.load("iso_forest.pkl")
            print("✅ Loaded iso_forest.pkl")
        else:
            print("ℹ️  iso_forest.pkl not found — skipping")

        ML_READY = consumption_model is not None and cause_model is not None
        print(f"🧠 ML mode: {'ON' if ML_READY else 'OFF (LLM only)'}")
    except ImportError as e:
        print(f"⚠️  ML libraries not installed: {e}")
        ML_READY = False
    except Exception as e:
        print(f"⚠️  Model loading failed: {e}")
        ML_READY = False

load_ml_models()


def cc_to_displacement(cc):
    return cc / 16.387


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/healthz")
def healthz():
    """Simple health check — Render can ping this."""
    return jsonify({"status": "ok", "ml_ready": ML_READY})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json() or {}

        # Journey context
        car_name   = data.get("carName", "your car")
        distance   = float(data.get("distance", 0))
        latest     = float(data.get("latest", 0))
        baseline   = float(data.get("baseline", 0))
        difference = float(data.get("difference", 0))
        condition  = data.get("condition", "normal")
        fuel_type  = data.get("fuelType", "RON 95")
        subsidised = data.get("subsidised", False)
        extra_cost = float(data.get("extraCost", 0))
        is_first   = data.get("isFirstLog", False)

        car_type      = data.get("car_type", "sedan")
        car_condition = data.get("car_condition", "good")
        engine_cc     = float(data.get("engine_cc", 1500))
        year          = int(data.get("year", 2020))
        purpose       = data.get("purpose", "commuting")
        trip_type     = data.get("trip_type", "mixed")
        traffic       = data.get("traffic", "sometimes")
        style         = data.get("style", "smooth")
        idling        = data.get("idling", "medium")

        predicted_cause = None
        predicted_l100  = None
        anomaly_score   = None
        is_anomaly      = False

        # ---- ML predictions (only if models loaded) ----
        if ML_READY:
            try:
                import pandas as pd

                row_mpg = pd.DataFrame([{
                    "displacement":  cc_to_displacement(engine_cc),
                    "cylinders":     4,
                    "horsepower":    engine_cc / 15,
                    "weight":        1500 + (engine_cc / 2),
                    "acceleration":  15.0,
                    "model_year":    year % 100,
                    "origin":        3
                }])
                predicted_mpg = float(consumption_model.predict(row_mpg)[0])
                predicted_l100 = 235.215 / predicted_mpg

                if iso_forest is not None:
                    anomaly_score = float(iso_forest.score_samples([[predicted_mpg]])[0])
                    is_anomaly = anomaly_score < -0.05

                if cause_model is not None and difference >= 15:
                    row_cause = pd.DataFrame([{
                        "car_type":      car_type,
                        "car_condition": car_condition,
                        "purpose":       purpose,
                        "trip_type":     trip_type,
                        "traffic":       traffic,
                        "style":         style,
                        "idling":        idling,
                        "condition":     condition,
                        "engine_cc":     int(engine_cc),
                        "year":          year,
                        "distance":      distance
                    }])
                    predicted_cause = cause_model.predict(row_cause)[0]
            except Exception as e:
                print(f"[ML] Error: {e}")

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

        if predicted_cause:
            context_parts.append(
                f"Machine learning diagnosis: the most likely cause is '{predicted_cause}'."
            )

        context_parts.append(
            f"Driver habits — car: {car_type}, style: {style}, "
            f"traffic: {traffic}, idling: {idling}, trips: {trip_type}."
        )

        # ---- Call Groq ----
        ai_advice = None
        if client:
            prompt = f"""You are EcoDrive AI, a warm Malaysian fuel-saving coach.

Context: {' '.join(context_parts)}
Conditions: {condition}
Fuel: {fuel_type}{' (subsidised)' if subsidised else ''}

Write ONE short paragraph (50-80 words):
1. React naturally (celebrate if normal/first, gently warn if abnormal)
2. Name the most likely cause in plain English
3. Give TWO practical Malaysian-context suggestions
4. Friendly mentor tone, no bullets, no emojis.

Just the paragraph."""

            try:
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=220
                )
                ai_advice = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[Groq Error] {e}")

        return jsonify({
            "ai_advice":       ai_advice,
            "predicted_cause": predicted_cause,
            "predicted_l100":  round(predicted_l100, 2) if predicted_l100 else None,
            "anomaly_score":   anomaly_score,
            "is_anomaly":      is_anomaly,
            "ml_ready":        ML_READY
        })

    except Exception as e:
        # Never return 500 — always return JSON so frontend can show something
        print(f"[predict] Unhandled error: {e}")
        return jsonify({
            "ai_advice": "AI coach is briefly unavailable. Please try again in a moment.",
            "predicted_cause": None,
            "ml_ready": False,
            "error": str(e)
        }), 200


if __name__ == "__main__":
    if not GROQ_API_KEY:
        print("⚠️  WARNING: GROQ_API_KEY not found in .env file!")
    else:
        print("✅ GROQ_API_KEY loaded successfully.")
    app.run(debug=False, port=5001)   # <-- changed from 5000 to 5001