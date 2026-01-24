# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Use the CLIENT_PORT environment variable
ENV PORT=${CLIENT_PORT}

# Expose the port defined in the environment variable
EXPOSE ${PORT}

# Define the command to run your app
CMD ["npm", "start"]
