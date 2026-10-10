
from ucimlrepo import fetch_ucirepo
import pandas as pd
from pathlib import Path

# Download the Auto MPG dataset
print("Downloading vehicle data...")

auto_mpg = fetch_ucirepo(id=9)

# Combine vehicle features and fuel-efficiency target
X = auto_mpg.data.features
y = auto_mpg.data.targets

data = pd.concat([X, y], axis=1)

# Create a folder to store the dataset
data_folder = Path("data")
data_folder.mkdir(exist_ok=True)

# Save the dataset as a CSV file
data.to_csv(data_folder / "auto_mpg.csv", index=False)

print("\nDataset downloaded successfully!")
print("Dataset shape:", data.shape)
print("\nFirst 5 rows:")
print(data.head())

print("\nColumn names:")
print(data.columns.tolist())

print("\nMissing values:")
print(data.isnull().sum())
