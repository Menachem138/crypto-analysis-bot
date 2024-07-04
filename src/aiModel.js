import * as tf from '@tensorflow/tfjs';

// Set TensorFlow.js to use the CPU backend
tf.setBackend('cpu');

// Define the model architecture
const createModel = () => {
  const model = tf.sequential();

  // Add layers to the model
  model.add(tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 }));

  // Compile the model
  model.compile({
    optimizer: tf.train.adam(),
    loss: 'meanSquaredError',
    metrics: ['mse'],
  });

  return model;
};

// Train the model
const trainModel = async (model, trainData, trainLabels) => {
  const history = await model.fit(trainData, trainLabels, {
    epochs: 50,
    batchSize: 32,
    validationSplit: 0.2,
  });

  return history;
};

// Evaluate the model
const evaluateModel = async (model, testData, testLabels) => {
  const result = await model.evaluate(testData, testLabels);
  return result;
};

export { createModel, trainModel, evaluateModel };
