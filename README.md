# Flow - Workflow Automation Dashboard

Flow is a React + Vite application that provides a visual environment for designing, managing, and executing automation workflows. The dashboard makes it easy to iterate on node-based workflows, manage credentials, and monitor historical executions from a single place.

## Features

- **Workflow builder** – Create, edit, duplicate, and export node-based workflows with an intuitive UI.
- **Credential management** – Store and manage the secrets used across your automations.
- **Execution console** – Trigger new executions, inspect real-time status, review step-by-step logs, and retry failed nodes.
- **Import & export** – Move automation definitions between environments with JSON import/export.
- **Status insights** – Track when workflows were updated, whether they are active, and how executions progress over time.

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080` by default.

### Available scripts

- `npm run dev` – Start the development server with hot reloading.
- `npm run build` – Build the production bundle.
- `npm run preview` – Preview the production build locally.
- `npm run lint` – Run ESLint using the project configuration.

## Project structure

```
src/
  components/       Reusable UI elements and the main dashboard views
  pages/            Route-level components
  store/            Zustand stores that manage application state
  types.ts          Shared TypeScript types
  utils/            API helpers and supporting utilities
```

## Environment variables

Check `src/utils/api.ts` for the API base URL configuration. Update your `.env` file as needed to point to the correct backend services.

## Deployment

Build the app with `npm run build` and serve the contents of the `dist` directory using any static host (Vercel, Netlify, AWS S3, etc.).

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes and add tests when applicable.
3. Run `npm run lint` to ensure the codebase remains healthy.
4. Submit a pull request describing your updates.

## License

This project is distributed under the MIT License. See `LICENSE` (if present) for more information.