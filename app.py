
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


def calculate_fuel_efficiency(distance_km, litres_used):
    """Calculate fuel consumption in litres per 100 km."""
    if distance_km <= 0 or litres_used <= 0:
        raise ValueError("Distance and litres must be greater than zero.")

    return (litres_used / distance_km) * 100


def calculate_extra_cost(
    baseline_l_per_100km,
    current_l_per_100km,
    monthly_distance_km,
    fuel_price
):
    """Estimate extra monthly fuel cost if higher consumption continues."""
    extra_litres_per_100km = max(
        0, current_l_per_100km - baseline_l_per_100km
    )

    return (
        extra_litres_per_100km
        * monthly_distance_km
        / 100
        * fuel_price
    )


def detect_anomaly(current_efficiency, baseline_efficiency):
    """Flag consumption more than 20% above the baseline."""
    if baseline_efficiency <= 0:
        return False

    return current_efficiency > baseline_efficiency * 1.20


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()

        distance = float(data["distance"])
        litres = float(data["litres"])
        baseline = float(data["baseline"])
        monthly_distance = float(data["monthly_distance"])
        fuel_price = float(data["fuel_price"])

        efficiency = calculate_fuel_efficiency(distance, litres)
        extra_cost = calculate_extra_cost(
            baseline,
            efficiency,
            monthly_distance,
            fuel_price
        )
        anomaly = detect_anomaly(efficiency, baseline)

        if anomaly:
            category = "Unusual Increase"
            priority = "High" if extra_cost >= 30 else "Medium"
            recommendation = (
                "Review traffic conditions, idling and tyre pressure. "
                "If the increase persists, consider a vehicle inspection."
            )
        else:
            category = "Normal Range"
            priority = "Low"
            recommendation = (
                "Continue monitoring your fuel consumption and "
                "compare future records with your usual pattern."
            )

        percentage_change = (
            (efficiency - baseline) / baseline * 100
            if baseline > 0 else 0
        )

        return jsonify({
            "efficiency": round(efficiency, 2),
            "baseline": round(baseline, 2),
            "percentage_change": round(percentage_change, 1),
            "anomaly": anomaly,
            "category": category,
            "priority": priority,
            "extra_monthly_cost": round(extra_cost, 2),
            "recommendation": recommendation
        })

    except (KeyError, TypeError, ValueError) as error:
        return jsonify({"error": str(error)}), 400


if __name__ == "__main__":
    app.run(debug=True)
