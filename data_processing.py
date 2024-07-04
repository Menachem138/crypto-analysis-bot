import pandas as pd

# Load the CSV data into a pandas DataFrame
def load_data(file_path):
    data = pd.read_csv(file_path)
    return data

# Perform data cleaning and preprocessing
def preprocess_data(data):
    # Handle missing values
    data = data.dropna()

    # Normalize the data (example: scaling the 'Close' prices)
    data['Close'] = (data['Close'] - data['Close'].min()) / (data['Close'].max() - data['Close'].min())

    return data

# Conduct exploratory data analysis
def exploratory_data_analysis(data):
    print("Data Head:")
    print(data.head())

    print("\nData Description:")
    print(data.describe())

    print("\nData Info:")
    print(data.info())

# Prepare the data for training
def prepare_data_for_training(data):
    # Example: Splitting the data into training and testing sets
    train_size = int(len(data) * 0.8)
    train_data = data[:train_size]
    test_data = data[train_size:]

    return train_data, test_data

if __name__ == "__main__":
    file_path = "/home/ubuntu/browser_downloads/Binance_1INCHBTC_d.csv"

    # Load the data
    data = load_data(file_path)

    # Preprocess the data
    data = preprocess_data(data)

    # Perform exploratory data analysis
    exploratory_data_analysis(data)

    # Prepare the data for training
    train_data, test_data = prepare_data_for_training(data)

    print("\nTraining Data Head:")
    print(train_data.head())

    print("\nTesting Data Head:")
    print(test_data.head())
