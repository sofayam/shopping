Based on the provided documents, here is a guide to getting the Shopping App configured and running.

### System Overview

The application follows a client-server architecture:

*   **Backend**: A Node.js/Express server that manages the data. It serves a REST API to interact with two JSON files: `catalog.json` (for all products) and `shopping_list.json` (for the current list).
*   **Frontend**: A React single-page application that provides the user interface for managing the catalog and the shopping list. It communicates with the backend via the API.

Both parts of the application must be running simultaneously for the system to work correctly.

### 1. Configuration: Install Dependencies

Before you can run the application, you need to install the required Node.js packages for both the client and the server.

**A. Install Server Dependencies:**

Open a terminal and navigate to the `server` directory. Run the following command:

```bash
cd server
npm install
```

**B. Install Client Dependencies:**

Open a second terminal and navigate to the `client` directory. Run the following command:

```bash
cd client
npm install
```

### 2. Running the Application

You will need two separate terminals running at the same time.

**A. Start the Backend Server:**

In your first terminal, which should still be in the `/server` directory, start the Node.js server:

```bash
node server.js
```

You should see a message indicating that the server is running, typically on a port like `3001`. This terminal must remain open.

**B. Start the Frontend Client:**

In your second terminal, which should still be in the `/client` directory, start the React development server:

```bash
npm start
```

This will automatically open a new tab in your default web browser with the application loaded. The React app uses a proxy to forward API requests to the backend server, so you can use the application without any further configuration.
