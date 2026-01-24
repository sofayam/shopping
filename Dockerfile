# Stage 1: Build the React frontend
FROM node:20-alpine AS client_builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build and run the Node.js backend, serving the frontend
FROM node:20-alpine
WORKDIR /app
# Copy server's package.json and install dependencies
COPY server/package.json server/package-lock.json ./server/
RUN npm install --prefix ./server

# Copy the built React app from the client_builder stage
COPY --from=client_builder /app/client/build ./client/build

# Copy the server application code and data files
COPY server/ ./server/
# Documentation files are not needed in the container

# Expose the port the server runs on
EXPOSE 3001

# Create a volume for data persistence for the YAML files
# This ensures data in /app/server/data is persisted outside the container
VOLUME /app/server/data

# Command to run the application
CMD ["node", "server/server.js"]
