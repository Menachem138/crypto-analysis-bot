import pandas as pd

# Load the CSV data into a pandas DataFrame
def load_data(file_path):
    data = pd.read_csv(file_path, skiprows=1)  # Skip the first row
    print("Data Columns:", data.columns)  # Print the columns of the DataFrame
    return data

# Perform data cleaning and preprocessing
def preprocess_data(data):
    # Handle missing values
    data = data.dropna()

    # Normalize the data (example: scaling the 'Close' prices)
    data['Close'] = (data['Close'] - data['Close'].min()) / (data['Close'].max() - data['Close'].min() + 1e-8)

    # Select and engineer 10 relevant features
    data['Open_Close_diff'] = data['Open'] - data['Close']
    data['High_Low_diff'] = data['High'] - data['Low']
    data['Average_Price'] = (data['Open'] + data['Close']) / 2
    data['Price_Range'] = data['High'] - data['Low']
    data['Volume_Change'] = data['Volume BTC'].pct_change().fillna(0)
    data['Close_Change'] = data['Close'].pct_change().fillna(0)
    data['Rolling_Mean_Close'] = data['Close'].rolling(window=5).mean().fillna(0)
    data['Rolling_Std_Close'] = data['Close'].rolling(window=5).std().fillna(0)
    data['Exponential_Moving_Avg'] = data['Close'].ewm(span=5, adjust=False).mean().fillna(0)
    data['Relative_Strength_Index'] = 100 - (100 / (1 + data['Close_Change'].rolling(window=14).mean() / data['Close_Change'].rolling(window=14).std().fillna(0)))

    # Replace any remaining NaN values with zeros
    data = data.fillna(0)

    # Select the 10 features for the model
    features = data[['Open_Close_diff', 'High_Low_diff', 'Average_Price', 'Price_Range', 'Volume_Change', 'Close_Change', 'Rolling_Mean_Close', 'Rolling_Std_Close', 'Exponential_Moving_Avg', 'Relative_Strength_Index']]

    return features, data['Close']

# Conduct exploratory data analysis
def exploratory_data_analysis(data):
    print("Data Head:")
    print(data.head())

    print("\nData Description:")
    print(data.describe())

    print("\nData Info:")
    print(data.info())

# Prepare the data for training
def prepare_data_for_training(features, labels):
    # Example: Splitting the data into training and testing sets
    train_size = int(len(features) * 0.8)
    train_features = features[:train_size]
    train_labels = labels[:train_size]
    test_features = features[train_size:]
    test_labels = labels[train_size:]

    return train_features, train_labels, test_features, test_labels

if __name__ == "__main__":
    file_path = "/home/ubuntu/browser_downloads/Binance_1INCHBTC_d.csv"

    # Load the data
    data = load_data(file_path)

    # Preprocess the data
    features, labels = preprocess_data(data)

    # Perform exploratory data analysis
    exploratory_data_analysis(data)

    # Prepare the data for training
    train_features, train_labels, test_features, test_labels = prepare_data_for_training(features, labels)

    print("\nTraining Features Head:")
    print(train_features.head())

    print("\nTraining Labels Head:")
    print(train_labels.head())

    print("\nTesting Features Head:")
    print(test_features.head())

    print("\nTesting Labels Head:")
    print(test_labels.head())
