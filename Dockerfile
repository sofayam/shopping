# Stage 1: Build the React client
FROM node:18-alpine AS build

WORKDIR /app/client

# Copy client dependency manifests and install dependencies
COPY client/package.json client/package-lock.json ./
RUN npm install

# Copy the rest of the client source code and build the static files
COPY client/ ./
RUN npm run build

# ---

# Stage 2: Setup the production server
FROM node:18-alpine

WORKDIR /app

# Copy server dependency manifests and install production dependencies
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev

# Copy the server source code
COPY server/ ./

# Copy the built client from the 'build' stage
COPY --from=build /app/client/build ./client/build

# Expose the port the server will run on
EXPOSE 3001

# Command to start the server
CMD ["node", "server.js"]
