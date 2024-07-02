from flask import Flask, jsonify, request, redirect, make_response
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import redis
import openai
import requests
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(filename='flask_server.log', level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    logger.info('Response headers (after_request): %s', response.headers)
    return response

# Initialize Redis client
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

# Load the trained model
model_path_json = '/app/crypto_prediction_model.json'
model_path_weights = '/app/crypto_prediction_model.weights.h5'

def custom_objects():
    from tensorflow.keras.layers import InputLayer
    from tensorflow.keras.mixed_precision.experimental import Policy as DTypePolicy
    from tensorflow.keras.initializers import Orthogonal as OrthogonalInitializer

    class CustomOrthogonalInitializer(OrthogonalInitializer):
        def __init__(self, gain=1.0):
            super(CustomOrthogonalInitializer, self).__init__(gain=gain)

    return {
        'InputLayer': InputLayer,
        'DTypePolicy': DTypePolicy,
        'OrthogonalInitializer': OrthogonalInitializer,
        'CustomOrthogonalInitializer': CustomOrthogonalInitializer
    }

if os.path.exists(model_path_json) and os.path.exists(model_path_weights):
    try:
        with open(model_path_json, 'r') as json_file:
            model_json = json_file.read()
            model_json = model_json.replace('"batch_shape":', '"input_shape":')
            logger.info('Modified model JSON: %s', model_json)
        with tf.keras.utils.custom_object_scope(custom_objects()):
            model = tf.keras.models.model_from_json(model_json, custom_objects=custom_objects())
            model.load_weights(model_path_weights)
        logger.info('Model loaded successfully.')
    except Exception as e:
        logger.error('Error loading model: %s', str(e))
        raise
else:
    logger.error('Model file not found at path: %s or %s', model_path_json, model_path_weights)
    raise FileNotFoundError(f'Model file not found at path: {model_path_json} or {model_path_weights}')

# Function to make predictions
def make_predictions():
    # Simulated input data for prediction
    input_data = np.array([[0.01, 0.02, 0.03, 0.04]])  # Example input data
    predictions = model.predict(input_data)
    return predictions[0]

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    logger.info('Received request for /api/predictions')
    logger.info('Request headers: %s', request.headers)
    try:
        # Check if the predictions are cached in Redis
        cached_predictions = redis_client.get('predictions')
        if (cached_predictions):
            predictions = np.frombuffer(cached_predictions, dtype=np.float32)
            logger.info("Fetched predictions from cache.")
        else:
            # Generate predictions using the loaded model
            predictions = make_predictions()
            # Cache the predictions in Redis for 60 seconds
            redis_client.setex('predictions', 60, predictions.tobytes())
            logger.info("Generated new predictions and cached them.")

        response = {
            'next_hour': float(predictions[0]),
            'next_day': float(predictions[0] * 24),  # Example transformation
            'next_week': float(predictions[0] * 24 * 7)  # Example transformation
        }
        res = make_response(jsonify(response))
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        logger.info('Response headers: %s', res.headers)
        logger.info('Response for /api/predictions: %s', response)
        return res
    except Exception as e:
        logger.error('Error in /api/predictions: %s', str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    logger.info('Received request for /api/chat')
    logger.info('Request headers: %s', request.headers)
    try:
        user_message = request.json.get('message')
        if not user_message:
            return jsonify({'reply': 'Please provide a message.'}), 400

        # Use OpenAI GPT to generate a response
        openai.api_key = os.environ.get("OPENAI_API_KEY")
        response = openai.Completion.create(
            engine="davinci",
            prompt=user_message,
            max_tokens=150
        )
        reply = response.choices[0].text.strip()

        # Enhance the response with investment recommendations
        if "investment" in user_message.lower() or "recommendation" in user_message.lower():
            # Fetch the latest predictions
            predictions_response = requests.get('https://real-time-cryptocurrency-app-d8btfgz9.devinapps.com/api/predictions')
            predictions = predictions_response.json()

            # Fetch the latest prices
            prices_response = requests.get('https://real-time-cryptocurrency-app-d8btfgz9.devinapps.com/api/prices')
            prices = prices_response.json()

            # Fetch the latest news
            news_response = requests.get('https://real-time-cryptocurrency-app-d8btfgz9.devinapps.com/api/news')
            news = news_response.json()

            # Generate a detailed recommendation
            recommendation = f"\n\nBased on the latest data:\n"
            for crypto, data in predictions.items():
                recommendation += f"{crypto}: Predicted price next hour: ${data['next_hour']:.2f}, next day: ${data['next_day']:.2f}, next week: ${data['next_week']:.2f}\n"
                recommendation += f"Current price: ${prices[crypto]['usd']}, 24h change: {prices[crypto]['usd_24h_change']:.2f}%\n"
            recommendation += f"\nLatest news:\n"
            for article in news['data']:
                recommendation += f"- {article['title']}: {article['url']}\n"

            reply += recommendation

        res = make_response(jsonify({'reply': reply}))
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        logger.info('Response headers: %s', res.headers)
        logger.info('Response for /api/chat: %s', reply)
        return res
    except Exception as e:
        logger.error('Error in /api/chat: %s', str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/news', methods=['GET'])
def get_news():
    logger.info('Received request for /api/news')
    logger.info('Request headers: %s', request.headers)
    try:
        tickers = request.args.get('tickers', 'BTC,ETH,LTC,XRP,ADA,DOT,BNB,LINK')
        items = request.args.get('items', 10)
        url = f"https://cryptonews-api.com/api/v1?tickers={tickers}&items={items}&token={os.environ.get('CRYPTO_NEWS_API_KEY')}"
        response = requests.get(url)
        if response.status_code == 200:
            news_data = response.json()
        else:
            news_data = None

        res = make_response(jsonify(news_data))
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        logger.info('Response headers: %s', res.headers)
        logger.info('Response for /api/news: %s', news_data)
        return res
    except Exception as e:
        logger.error('Error in /api/news: %s', str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/prices', methods=['GET'])
def get_prices():
    logger.info('Received request for /api/prices')
    logger.info('Request headers: %s', request.headers)
    try:
        url = 'https://api.coinbase.com/v2/prices/spot?currency=USD'
        response = requests.get(url)
        if response.status_code == 200:
            prices_data = response.json()
        else:
            prices_data = None

        res = make_response(jsonify(prices_data))
        res.headers['Access-Control-Allow-Origin'] = '*'
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        logger.info('Response headers: %s', res.headers)
        logger.info('Response for /api/prices: %s', prices_data)
        return res
    except Exception as e:
        logger.error('Error in /api/prices: %s', str(e))
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, ssl_context=('cert.pem', 'key.pem'))
