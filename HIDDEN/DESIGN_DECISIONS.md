# Design Decisions for the Shopping App Prototype

This document outlines the key design and architectural decisions made during the initial setup and subsequent development of the Shopping App project. It is intended to brief a developer who will continue its development.

### 1. Overall Architecture

*   **Client-Server Model**: The application is split into a frontend client and a backend server to separate concerns.
*   **Monorepo Structure**: The project is contained in a single repository with two primary directories:
    *   `/client`: A React-based frontend application.
    *   `/server`: A Node.js backend API.
    This structure simplifies development and deployment by keeping related code together.

### 2. Backend Design (`/server`)

*   **Technology**: The server is built with **Node.js** and the **Express.js** framework. This provides a lightweight and fast foundation for the API, which is a common choice for applications with a React frontend.
*   **Data Persistence**: All application data is stored in plain **JSON files** located in the `/server/data` directory.
    *   `catalog.json`: Stores the master list of all purchasable items. Items are identified by their unique `name`.
    *   `shopping_list.json`: Stores the items currently on the single, active shopping list. Each entry has a unique `listId` (UUID) and references a catalog item by its `name`.
    *   `shops.json`: Stores defined shops, identified by their unique `name`. Each shop references a `shopTypeName`.
    *   `shop_types.json`: Stores defined shop types (e.g., "Supermarket"), identified by their unique `name`, and lists the `productTypes` they sell.
    This approach avoids the need for a database setup in the prototype phase.
*   **API**: A RESTful API is exposed to perform CRUD (Create, Read, Update, Delete) operations on the data. All endpoints are prefixed with `/api`.
    *   **Identifier Change**: All API endpoints now use the `name` field as the primary identifier for catalog items, shops, and shop types, instead of UUIDs. This requires names to be unique.
    *   **Robustness**: File write operations now include error handling, returning a 500 status if data cannot be persisted to disk.
    *   **Integrity Check**: A `GET /api/integrity-check` endpoint has been added to perform data validation at startup, checking for:
        *   Referential integrity (e.g., shops referenced in catalog items must exist).
        *   Uniqueness of names across entities.
        *   Consistency between shopping list and catalog.
*   **Cross-Origin Resource Sharing (CORS)**: The `cors` middleware is enabled to allow the frontend (running on a different port during development) to make requests to the server.

### 3. Frontend Design (`/client`)

*   **Technology**: The frontend is a **React** single-page application (SPA), bootstrapped using `create-react-app`.
*   **Styling**: The UI is built using **React Bootstrap** components with the standard **Bootstrap** CSS library. This was chosen for rapid development of a clean, responsive, and modern-looking interface.
*   **State Management**: Application state (catalog, shops, shop types, shopping list, integrity report) is managed centrally within the main `App.js` component using **React Hooks** (`useState`, `useEffect`, `useMemo`).
    *   **Shopping List Synchronization**: The shopping list automatically synchronizes with changes in the catalog and shop data to reflect updated item availability.
    *   **Enriched Catalog**: A memoized `enrichedCatalog` is generated, which includes `availableShops` for each item, derived from its explicit `shops` list or its `type` and associated `shopTypes`.
    *   **Optimistic Updates**: Catalog item updates are optimistically applied to the UI for a better user experience, with server-side validation and error reporting.
*   **Component Structure**: The UI is broken into reusable components located in `/client/src/components`, including:
    *   `ShoppingList.js`: Displays the current list, allows ticking off/removing items, and implements an optimization algorithm to minimize shop visits when no specific shop filter is applied. It now uses `availableShops` for filtering.
    *   `CatalogManagement.js`: Provides a view of the product catalog, a form to add new items, and functionality to edit/delete existing items. Items are identified by `name`.
    *   `ShopManagement.js`: Provides an interface to create, view, edit, and delete shops. Shops are identified by `name` and are associated with a `shopTypeName`.
    *   `ShopTypeManagement.js`: Provides an interface to create, view, edit, and delete shop types. Shop types are identified by `name` and define `productTypes` they sell.
    *   `AddItemForm.js`: An autocomplete form for adding items from the catalog to the shopping list.
    *   `IntegrityReport.js`: Displays the results of the data integrity check.
*   **API Communication**: The **Axios** library is used for all HTTP requests to the backend. A **proxy** is configured in `package.json` to forward API requests.
*   **PWA**: The project meets the basic requirements for a Progressive Web App (PWA). `create-react-app` includes a default `manifest.json` file, and a basic `service-worker.js` is provided for installability.

### 4. Development Environment

*   **`.gitignore`**: The project contains three `.gitignore` files (root, client, server) to ensure unnecessary files (e.g., `node_modules`, build artifacts, local environment variables, and application data files like `data/*.json`) are not committed to version control.