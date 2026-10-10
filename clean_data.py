
from pathlib import Path
import pandas as pd

# 1. Find the project folder and dataset
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "auto_mpg.csv"
OUTPUT_PATH = BASE_DIR / "data" / "auto_mpg_clean.csv"

print("Starting data cleaning...")

# 2. Load the original dataset
df = pd.read_csv(DATA_PATH)

print("\nOriginal dataset shape:", df.shape)
print("\nOriginal missing values:")
print(df.isnull().sum())

# 3. Standardise column names
df.columns = df.columns.str.strip().str.lower()

# 4. Convert columns to numeric values
for column in df.columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")

# 5. Remove rows without the target value
before = len(df)
df = df.dropna(subset=["mpg"])
print("\nRows removed due to missing MPG:", before - len(df))

# 6. Remove duplicate rows
before = len(df)
df = df.drop_duplicates()
print("Duplicate rows removed:", before - len(df))

# 7. Fill missing horsepower using its median
missing_before = df["horsepower"].isna().sum()
median_hp = df["horsepower"].median()

df["horsepower"] = df["horsepower"].fillna(median_hp)

print("Missing horsepower values filled:", missing_before)
print("Median horsepower used:", median_hp)

# 8. Check for remaining missing values
print("\nMissing values after cleaning:")
print(df.isnull().sum())

# 9. Save the cleaned dataset
df.to_csv(OUTPUT_PATH, index=False)

print("\nCleaned dataset saved to:", OUTPUT_PATH)
print("Final dataset shape:", df.shape)
print("\nData cleaning completed!")
