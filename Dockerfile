# Use an official Node.js runtime as a parent image
FROM --platform=$BUILDPLATFORM node:20-slim
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM" > /log

# Set the working directory in the container to /app
WORKDIR /usr/src/app

# Copy the current directory contents into the container.
COPY ./ ./

# Set the PYTHONPATH environment variable
ENV PYTHONPATH "${PYTHONPATH}:/usr/src/app/backend"

# Install Python and aptitude package manager which we need to install chromium
RUN apt-get update && apt-get install -y \
python3 \
python3-pip \
python3.11-venv \
aptitude

# Install chromium and chromedriver dependencies
RUN aptitude install -y chromium-driver chromium

# Remove aptitude libraries to save space
RUN apt-get purge -y aptitude && apt-get autoremove -y && apt-get clean

# Check if .env file exists and create it if it doesn't
RUN touch .env

RUN echo "\nCHROME_PATH=\"/usr/bin/chromium\"" >> .env && \
    echo "CHROMEDRIVER_PATH=\"/usr/bin/chromedriver\"" >> .env;

# Set up a virtual environment and install Python dependencies.
RUN python3 -m venv venv && \
. venv/bin/activate && \
pip3 install -q -r backend/requirements.txt

# Install frontend dependencies
WORKDIR /usr/src/app/frontend
RUN npm install
RUN npm run build

# Move back to the root directory
WORKDIR /usr/src/app

# Create a new user 'appuser'.
RUN useradd -m appuser

# Change the ownership of the copied files to 'appuser'.
RUN chown -R appuser:appuser /usr/src/app

# Expose port 3000 for the frontend and 3010 for the APIs.
EXPOSE 3000 3010

# Switch to 'appuser'.
USER appuser

# Setup MongoDB Atlas collections and run supervisord on start.
CMD ["/bin/bash", "-c", "source venv/bin/activate && python3 backend/setupCollections.py && python3 backend/installFeeds.py && supervisord"]