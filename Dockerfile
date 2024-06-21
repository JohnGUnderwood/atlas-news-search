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

# Update apt and ensure we have latest debian keys
# RUN apt-get update && apt-get install -y gnupg
# RUN apt-get install debian-archive-keyring && apt-key add /usr/share/keyrings/debian-archive-keyring.gpg

# Install required packages
RUN apt-get update && apt-get install -y \
python3 \
python3-pip \
python3-venv \
chromium-driver \
chromium

# Remove unneeded libraries to save space
# RUN apt-get purge -y gnupg && apt-get autoremove -y && apt-get clean

ENV CHROME_PATH="/usr/bin/chromium"
ENV CHROMEDRIVER_PATH="/usr/bin/chromedriver"

# Create a virtual environment
RUN python3 -m venv venv

# Install Python dependencies in the virtual environment
RUN venv/bin/pip3 install -q -r backend/requirements.txt

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

# Expose port 3000 for the frontend.
EXPOSE 3000

# Switch to 'appuser'.
USER appuser

# Setup MongoDB Atlas collections and run supervisord on start.
ENTRYPOINT ["/bin/bash", "-c", "source venv/bin/activate python3 backend/setupCollections.py && python3 backend/installFeeds.py && supervisord"]