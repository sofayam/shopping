# Shopping PWA - Copilot Instructions

## Architecture Overview

This is a full-stack Progressive Web App (PWA) for shopping list management. The system follows a **consolidated server model**: a single Node.js/Express server serves both the React frontend (static build) and REST API on port 3001.

### Data Model (See Datamodel.md)
- **Core entities**: Items, Shops, ItemTypes, ShopTypes
- **Key mapping**: `shop_type_to_item_types.yaml` defines which item types are sold in which shop types (many-to-many with explicit order)
- **User data**: Master `itemList` (persistent shopping needs) vs temporary `purchaseList` (per-trip; not persisted)
- **Preferred shop**: Optional preference on Items; used as tiebreaker when multiple shops have the same item type

### Folder Structure
- `server/` - Node.js/Express backend, serves static files + API
- `client/` - React frontend (React Router v7, no Redux)
- `data_persistence/` - YAML files (single source of truth; persisted in Docker volume)
- `data_example/` - Reference data files

## Critical Development Workflows

### Local Development & Testing
```bash
# Terminal 1: Build and watch React changes
cd client && npm run build    # Required once, or after changes
cd client && npm start        # Dev server (port 3000, proxies API to :3001)

# Terminal 2: Run backend
cd server && node server.js   # Runs on port 3001, serves built React files
```

### Production Build
```bash
cd client && npm run build  # Outputs to client/build (consumed by server)
cd server && node server.js # Serves React + API from single origin
```

### Docker Deployment
```bash
docker-compose up --build  # Builds both frontend and backend, runs server on :3001
# Data persists in ./data_persistence volume
```

## Code Patterns & Conventions

### Frontend (React)
- **Relative API paths**: All fetch calls use `/api/*` (relative URLs work seamlessly with consolidated server)
- **Data fetching**: Use `/api/all-data` to get complete application state (items, shops, itemTypes, shopTypeToItemTypes, itemList)
- **Server validation**: Never trust client-side data; server validates cross-file integrity (e.g., itemList only contains valid item names)
- **Autocomplete pattern**: Input fields with `appData.items` filtering for autocomplete (see ListPage.js for implementation)
- **Interactive list UI**: For `aisle_order` and shop type mappings, use interactive add/remove/reorder instead of textarea (see ShopManagement.js)

### Backend (Node.js/Express)
- **Generic data endpoint**: `POST /api/data/:fileName` updates any whitelisted YAML file (whitelist in EDITABLE_FILES array)
- **YAML persistence**: Use `readYaml(fileName)` and `writeYaml(fileName, data)` for all data I/O
- **Cross-file validation**: `/api/all-data` performs validation (see server.js lines 60-110):
  - Filters itemList to only include items from items.yaml
  - Validates shop aisle_order against available item types for that shop's type
  - Logs warnings for invalid entries before filtering
- **Error handling**: Robust `readYaml` returns empty array/object if file missing/unreadable
- **Static file serving**: `app.use(express.static(...))` serves React build; catch-all `app.get('*')` handles client-side routing

## Integration Points & Data Flow

### ShoppingPage Logic (See ShoppingPage.js, lines 46-75)
1. User selects shops
2. System filters itemList to items defined in items.yaml
3. For each item, finds best shop using:
   - Priority 1: Item's `preferred_shop` (if selected)
   - Priority 2: First selected shop that sells the item type (via shopTypeToItemTypes)
4. Sorts items within shop by `aisle_order` (or unordered if not in order)
5. Returns `{allocated: [...], unallocated: [...]}`

### Data Mutation Pattern
1. Component collects user input (e.g., new shop, modified aisle_order)
2. Calls `fetch('/api/data/:fileName', {method: 'POST', body: JSON.stringify(data)})`
3. Server validates and writes to YAML
4. Frontend refetches `/api/all-data` to confirm and get validated data back

## Project-Specific Quirks

- **Express version pinned to ^4.17.1**: Downgraded from latest due to PathError with wildcard routing (`app.get('*')`)
- **Single itemList**: No concept of multiple shopping lists; all items go to one persistent master list
- **CORS removed**: Frontend and backend share same origin, so no CORS middleware needed
- **Manual build step**: React build must be run before starting server; changes to client/ require rebuild
- **Data files must exist**: Empty/missing YAML files default to `{}` or `[]`; create files in data_persistence if needed

## Key Files to Review

- [server/server.js](../../server/server.js) - API endpoints, YAML I/O, validation logic
- [client/src/pages/ShoppingPage.js](../../client/src/pages/ShoppingPage.js) - Shopping list algorithm & item allocation
- [client/src/pages/ListPage.js](../../client/src/pages/ListPage.js) - Master itemList management with autocomplete
- [Datamodel.md](../../Datamodel.md) - Entity relationships and data structure
- [Implementation.md](../../Implementation.md) - Design decisions and rationale
