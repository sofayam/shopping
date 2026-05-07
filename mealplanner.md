# Meal Planner — build notes (2026-05-07)

## What we built

A new Meal Planner page added to the shopping PWA. It is completely independent of the shopping list logic — no item/shop data involved.

## Features

- Scrolling list of days, 30 days back and 30 days forward from today, centred on today at startup
- Today is visually highlighted (blue left border, light blue background); weekends are lightly shaded
- Each day has a "+ add meal" slot; tap it to enter a meal name
- Autocomplete dropdown shows all previously entered meals, sorted by most recently used when the input is empty, filtered as you type
- New meal names (not yet in the list) get an "Add X" button
- Tap any filled meal name to see a history bottom sheet — all dates that meal has appeared, with occurrence count
- Edit (✏) and delete (✕) buttons on filled rows
- All input is forced to lowercase
- Enter key saves; Escape cancels; Cancel button always visible
- Data persists in `data_persistence/meal_plan.yaml` and is included in the existing backup logic

## Files changed

- `server/server.js` — added `GET /api/meal-plan`, `POST /api/meal-plan`, `DELETE /api/meal-plan/:date`
- `client/src/pages/MealPlannerPage.js` — new page (546 lines)
- `client/src/App.js` — added import, "Meal Planner" nav link, `/meals` route

## Scaling

YAML is fine for years of use. Two years of daily entries (~730) is roughly 35–40 KB. The autocomplete pool of ~50 meals is trivially small.
