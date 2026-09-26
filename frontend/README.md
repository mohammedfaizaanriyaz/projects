# VYRA connected frontend

This version is matched to the committed backend plus the
`vyra_backend_daily_nutrition_patch`.

## Connected app flow

- Register / login / logout with backend HTTP-only cookie
- `/api/auth/me` session restore
- No localStorage user-ID identity
- Profiles
- Profile measurements
- Weight history + real chart
- Task lists + tasks
- Reminders
- USDA FoodData Central search
- Exact quantity nutrition calculation
- Add calculated USDA food to:
  - Breakfast
  - Lunch
  - Dinner
  - Snack
  - Other
- Daily MariaDB nutrition log
- Daily calorie counter
- Daily protein / carbs / fat / fibre
- Potassium / sodium / calcium / iron totals
- Daily food history
- Delete food from daily log
- Dashboard nutrition totals

## Required backend patch

Before using Daily Log, apply:

`vyra_backend_daily_nutrition_patch.zip`

and run:

```bash
sudo mariadb < db/db-init/002_add_nutrition_logs.sql
```

## Run

Backend:

```bash
cd ~/my_work/projects/backend
npm run dev
```

Frontend:

```bash
cd ~/my_work/projects/frontend
npm install
npm run dev
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Backend `.env` must include:

```env
FRONTEND_ORIGIN=http://localhost:5173
USDA_API_KEY=your_real_key_or_DEMO_KEY
```

## Nutrition flow

1. Open Nutrition Calculator
2. Search USDA food
3. Select exact result
4. Enter quantity + unit
5. Calculate
6. Select meal
7. Add to daily log
8. Dashboard + Daily Log update automatically
