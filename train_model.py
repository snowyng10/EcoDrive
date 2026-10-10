
from pathlib import Path

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


# Find the project folders
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "auto_mpg_clean.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "fuel_efficiency_model.joblib"

print("EcoDrive AI model training started!")

# 1. Load the dataset
df = pd.read_csv(DATA_PATH)
print("Dataset loaded:", df.shape)

# 2. Clean the data
df.columns = df.columns.str.strip().str.lower()

# Convert columns to numeric values
for column in df.columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")

# Remove rows without a target MPG value
df = df.dropna(subset=["mpg"])

# 3. Separate features and target
X = df.drop(columns=["mpg"])
y = df["mpg"]

print("Features:", X.columns.tolist())
print("Rows available for training:", len(df))

# 4. Split training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# 5. Create the prediction model
model = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("regressor", RandomForestRegressor(
        n_estimators=200,
        random_state=42
    ))
])

# 6. Train the model
print("Training model...")
model.fit(X_train, y_train)
print("Model training completed!")

# 7. Evaluate the model
predictions = model.predict(X_test)

mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print(f"Mean Absolute Error (MAE): {mae:.2f} MPG")
print(f"R-squared (R2): {r2:.3f}")

# 8. Save the trained model
MODEL_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_PATH)

print("Model saved successfully!")
print("Saved location:", MODEL_PATH)

# 9. Test one sample prediction
sample = X_test.iloc[[0]]
predicted_mpg = model.predict(sample)[0]

print("\nSample prediction:")
print(f"Predicted MPG: {predicted_mpg:.2f}")
print(f"Predicted fuel consumption: {235.215 / predicted_mpg:.2f} L/100 km")
print("\nEcoDrive AI training finished successfully!")
