import * as tf from '@tensorflow/tfjs';

// Set TensorFlow.js to use the CPU backend
tf.setBackend('cpu');

// Define the model architecture
const createModel = () => {
  console.log('Creating model...');
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

  console.log('Model created successfully:', model);
  return model;
};

// Train the model
const trainModel = async (model, trainData, trainLabels) => {
  console.log('Starting model training...');
  console.log('Training data shape:', trainData.shape);
  console.log('Training labels shape:', trainLabels.shape);
  console.log('Training data:', trainData.arraySync());
  console.log('Training labels:', trainLabels.arraySync());

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
    console.log('Before model.fit call');
    const history = await model.fit(trainData, trainLabels, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochBegin: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} starting...`);
        },
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} completed. Loss: ${logs.loss}, MSE: ${logs.mse}`);
        },
        onBatchEnd: (batch, logs) => {
          console.log(`Batch ${batch + 1} completed. Loss: ${logs.loss}, MSE: ${logs.mse}`);
        },
      },
    });
    console.log('Model trained successfully:', history);
    return history;
  } catch (error) {
    console.error('Error during model training:', error);
    console.log('Error stack trace during model training:', error.stack);
    console.log('Error name during model training:', error.name);
    console.log('Error message during model training:', error.message);
    throw error;
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
  }
};

export { createModel, trainModel, evaluateModel };
