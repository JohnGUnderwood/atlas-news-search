# Use an official Node.js runtime as a parent image
FROM --platform=$BUILDPLATFORM node:20-slim
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM" > /log

WORKDIR /usr/src/app
COPY ./ ./
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]