# Shopping App - Configuration and Execution Guide

This document provides instructions on how to run the Shopping App.

---

## Option 1: Running with Docker (Recommended)

### Prerequisites

*   Docker
*   Docker Compose

### Execution

The entire application (frontend and backend) can be started using Docker Compose.

1.  **Open a terminal** in the root directory of the project.

2.  **Run the following command:**

    ```bash
    docker-compose up --build
    ```

    *   The `--build` flag ensures that the Docker images are rebuilt if there are any changes to the `Dockerfile` or the application code.

3.  **Access the application:**
    *   The **Frontend** will be available at [http://localhost:3000](http://localhost:3000).
    *   The **Backend API** will be available at [http://localhost:3001](http://localhost:3001).

### Stopping the Application

1.  Press `Ctrl + C` in the terminal where `docker-compose` is running.
2.  To remove the containers, run: `docker-compose down`

---

## Option 2: Running Locally (Without Docker)

You will need two separate terminals to run the backend server and the frontend client simultaneously.

### Prerequisites

*   Node.js (v18 or later)
*   npm

### Terminal 1: Run the Backend Server

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    node server.js
    ```

4.  The backend API is now running at `http://localhost:3001`.

### Terminal 2: Run the Frontend Client

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the React development server:**
    ```bash
    npm start
    ```

4.  The frontend application will automatically open in your default web browser at `http://localhost:3000`.

---

## Project Structure

*   `/client`: Contains the React frontend application.
*   `/server`: Contains the Node.js Express backend API.
*   `/server/data`: Stores the `catalog.json` and `shopping_list.json` files.
*   `docker-compose.yml`: Orchestrates the multi-container setup for Docker.
