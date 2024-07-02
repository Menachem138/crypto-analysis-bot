import tensorflow as tf
import json
import os

# Paths to the model JSON and weights files
model_path_json = 'crypto_prediction_model.json'
model_path_weights = 'crypto_prediction_model.weights.h5'

# Function to load and verify the model and its weights
def verify_model_weights():
    if os.path.exists(model_path_json) and os.path.exists(model_path_weights):
        try:
            # Load the model architecture from the JSON file
            with open(model_path_json, 'r') as json_file:
                model_json = json_file.read()
            model = tf.keras.models.model_from_json(model_json, custom_objects=custom_objects())

            # Load the model weights
            model.load_weights(model_path_weights)
            print("Model and weights loaded successfully.")
            print("Model summary:")
            model.summary()
        except Exception as e:
            print(f"Error loading model or weights: {str(e)}")
    else:
        print(f"Model file not found at path: {model_path_json} or {model_path_weights}")

# Function to define custom objects for model deserialization
def custom_objects():
    from tensorflow.keras.layers import InputLayer
    from tensorflow.keras.mixed_precision import Policy as DTypePolicy
    from tensorflow.keras.initializers import Orthogonal as OrthogonalInitializer
    from tensorflow.keras.utils import register_keras_serializable

    @register_keras_serializable()
    class CustomOrthogonalInitializer(OrthogonalInitializer):
        def __init__(self, gain=1.0):
            super(CustomOrthogonalInitializer, self).__init__(gain=gain)

        def get_config(self):
            config = super(CustomOrthogonalInitializer, self).get_config()
            config.update({"gain": self.gain})
            return config

        @classmethod
        def from_config(cls, config):
            return cls(**config)

    custom_objs = {
        'InputLayer': InputLayer,
        'DTypePolicy': DTypePolicy,
        'OrthogonalInitializer': OrthogonalInitializer,
        'CustomOrthogonalInitializer': CustomOrthogonalInitializer
    }

    # Log the custom objects to verify registration
    print("Custom objects registered:")
    for key, value in custom_objs.items():
        print(f"{key}: {value}")

    return custom_objs

# Run the verification
verify_model_weights()
