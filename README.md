# Proctor Frontend

This is the frontend for the Video Interview Proctoring System, built with React and TypeScript.

## Features

- Candidate video proctoring with real-time detection overlays
- Interviewer dashboard
- Proctoring report generation

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (v8 or higher)

## Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd proctor-project/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

### Start the development server

```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
```

The optimized build will be in the `build/` folder.

## Environment Variables

If you need to connect to a custom backend or socket server, create a `.env` file in this directory and set:

```
REACT_APP_SOCKET_URL=http://localhost:5001
```

## Project Structure

- `src/components/` — React components
- `src/services/` — API and detection logic
- `src/types/` — TypeScript types

## Notes

- Make sure the backend server is running and accessible for full functionality.
- For best results, use the latest version of Chrome or Firefox.

---

For any issues, please contact the project maintainer.
