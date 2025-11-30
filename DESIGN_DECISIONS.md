# Design Decisions for the Shopping App Prototype

This document outlines the key design and architectural decisions made during the initial setup of the Shopping App project. It is intended to brief a developer who will continue its development.

### 1. Overall Architecture

*   **Client-Server Model**: The application is split into a frontend client and a backend server to separate concerns.
*   **Monorepo Structure**: The project is contained in a single repository with two primary directories:
    *   `/client`: A React-based frontend application.
    *   `/server`: A Node.js backend API.
    This structure simplifies development and deployment by keeping related code together.

### 2. Backend Design (`/server`)

*   **Technology**: The server is built with **Node.js** and the **Express.js** framework. This provides a lightweight and fast foundation for the API, which is a common choice for applications with a React frontend.
*   **Data Persistence**: As per the initial requirements, all data is stored in plain **JSON files** located in the `/server/data` directory.
    *   `catalog.json`: Stores the master list of all purchasable items.
    *   `shopping_list.json`: Stores the items currently on the single, active shopping list.
    This approach avoids the need for a database setup in the prototype phase.
*   **API**: A simple RESTful API is exposed to perform CRUD (Create, Read, Update, Delete) operations on the data. All endpoints are prefixed with `/api`.
*   **Cross-Origin Resource Sharing (CORS)**: The `cors` middleware is enabled to allow the frontend (running on a different port during development) to make requests to the server.

### 3. Frontend Design (`/client`)

*   **Technology**: The frontend is a **React** single-page application (SPA), bootstrapped using `create-react-app`.
*   **Styling**: The UI is built using **React Bootstrap** components with the standard **Bootstrap** CSS library. This was chosen for rapid development of a clean, responsive, and modern-looking interface.
*   **State Management**: Application state (the catalog, the shopping list) is managed centrally within the main `App.js` component using **React Hooks** (`useState`, `useEffect`). State and handler functions are passed down to child components via props. This avoids the complexity of a dedicated state management library like Redux for an application of this size.
*   **Component Structure**: The UI is broken into reusable components located in `/client/src/components`, including:
    *   `ShoppingList.js`: Displays the current list and allows items to be ticked off or removed.
    *   `CatalogManagement.js`: Provides a view of the entire product catalog and a form to add new items.
    *   `AddItemForm.js`: An autocomplete form for adding items from the catalog to the shopping list.
*   **API Communication**: The **Axios** library is used for all HTTP requests to the backend. To simplify development, a **proxy** is configured in the `package.json` file, which forwards API requests from the React development server to the backend server, avoiding CORS issues.
*   **PWA**: The project meets the basic requirements for a Progressive Web App (PWA), as `create-react-app` includes a default `manifest.json` file. No offline capabilities have been implemented, as per the requirements.

### 4. Development Environment

*   **`.gitignore`**: The project contains three `.gitignore` files:
    1.  A **root-level** file for common ignores (OS files, editor backups).
    2.  A **client-specific** file to ignore frontend dependencies (`node_modules`) and build artifacts.
    3.  A **server-specific** file to ignore backend dependencies.
This ensures that unnecessary files are not committed to version control.
