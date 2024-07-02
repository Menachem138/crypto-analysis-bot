# Use the official Python image from the Docker Hub
FROM python:3.8-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Copy the model file into the container at /app
COPY crypto_prediction_model.h5 /app/crypto_prediction_model.h5

# Install system dependencies
RUN apt-get update && apt-get install -y pkg-config libcairo2-dev build-essential libgirepository1.0-dev libdbus-1-dev

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install gunicorn
RUN pip install gunicorn

# Make port 5002 available to the world outside this container
EXPOSE 5002

# Define environment variable
ENV FLASK_APP=predictions_server.py
ENV FLASK_ENV=production

# Run the Flask server
CMD ["gunicorn", "-c", "gunicorn_config.py", "predictions_server:app"]
