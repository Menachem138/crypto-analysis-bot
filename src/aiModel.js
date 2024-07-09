import * as tf from '@tensorflow/tfjs';

// Set TensorFlow.js to use the CPU backend
tf.setBackend('cpu');

// Define the model architecture
const createModel = () => {
  console.log('Creating model...');
  const model = tf.sequential();

  // Add layers to the model
  model.add(tf.layers.dense({ inputShape: [10], units: 2, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'meanSquaredError',
    metrics: ['mse'],
  });

  console.log('Model created successfully:', model);
  return model;
};

// Train the model
const trainModel = async (model, trainData, trainLabels) => {
  console.log('Starting model training...');
  console.log('Training data shape:', trainData.shape);
  console.log('Training labels shape:', trainLabels.shape);

  // Check for NaN or infinite values in the input data
  const hasNaN = (tensor) => tf.any(tf.isNaN(tensor)).dataSync()[0];
  const hasInf = (tensor) => tf.any(tf.isInf(tensor)).dataSync()[0];

  if (hasNaN(trainData) || hasNaN(trainLabels)) {
    throw new Error('Training data contains NaN values');
  }

  if (hasInf(trainData) || hasInf(trainLabels)) {
    throw new Error('Training data contains infinite values');
  }

  try {
    console.log('Before sending data to the server for training');
    console.log('Memory usage before sending data:', tf.memory());

    // Convert tensors to arrays
    const trainDataArray = trainData.arraySync();
    const trainLabelsArray = trainLabels.arraySync();

    // Send training data to the server
    const response = await fetch('http://127.0.0.1:5000/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        features: trainDataArray,
        labels: trainLabelsArray,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Model trained successfully on the server:', result);

    return result;
  } catch (error) {
    console.error('Error during model training:', error);
    console.log('Error stack trace during model training:', error.stack);
    console.log('Error name during model training:', error.name);
    console.log('Error message during model training:', error.message);
    throw error;
  } finally {
    // Dispose of tensors to free up memory
    trainData.dispose();
    trainLabels.dispose();
  }
};

// Evaluate the model
const evaluateModel = async (model, testData, testLabels) => {
  console.log('Starting model evaluation...');
  try {
    const result = await model.evaluate(testData, testLabels);
    console.log('Model evaluated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error during model evaluation:', error);
    throw error;
  } finally {
    // Dispose of tensors to free up memory
    testData.dispose();
    testLabels.dispose();
  }
};

export { createModel, trainModel, evaluateModel };
