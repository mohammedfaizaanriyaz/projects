# Weight Tracker

Full-stack Weight Tracker built with **React, Node.js, Express, and MariaDB**.

## Setup & Run

### 1. Database

Start MariaDB and run:

```bash id="0q8lhh"
mariadb -u root -p < schema.sql
```

This creates the required database and tables.

### 2. Backend

```bash id="77ylcm"
cd backend
npm install
cp .env.example .env
```

Fill your database details in `.env`, then run:

```bash id="08hyx6"
node server.js
```

### 3. Frontend

Open another terminal:

```bash id="f2dsh8"
cd frontend
npm install
npm run dev
```

Open the URL shown in the terminal.

## Not Included in Repository

The following are not uploaded to GitHub:

```text id="d3o6po"
node_modules/
.env
Database data
```

They are recreated using:

* `package.json` → `npm install`
* `.env.example` → create `.env`
* `schema.sql` → create database and tables

## Project Flow

```text id="ezcq6d"
React → Node.js/Express → MariaDB
```




**Project Status:** Idea / Planning

**Platform:** Web App

**Current Version:** MVP Planning

**Tech Stack:** React + Node.js + Express.js + MariaDB

---

# PROJECT OVERVIEW

The Personal Health & Productivity App is an all-in-one application designed to help users manage their daily routine, diet, body weight, body measurements, and fitness progress.

Instead of using different applications for to-do lists, weight tracking, calorie tracking, and fitness progress, the user will be able to manage everything from one dashboard.

# CORE MODULES

- ✅ Daily Planner / To-Do List
- ⚖️ Weight & Body Composition Tracker
- 🥗 Diet & Macro Calculator
- 📊 Progress & Analytics
- 👤 User Profile
