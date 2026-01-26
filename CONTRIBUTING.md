# Contributing to OneFinance

Thank you for your interest in contributing to OneFinance! We welcome contributions from everyone. This document provides guidelines for contributing to the project.

## Tech Stack

*   **Frontend:** Vue 3 (Script Setup), TypeScript, PrimeVue, Tailwind CSS
*   **State Management:** Pinia
*   **Backend:** Electron (Main process in TypeScript), SQLite (`better-sqlite3`)
*   **Build Tooling:** Vite, Electron Builder

## Project Structure

The project follows a standard Electron + Vite structure:

*   **`electron/`**: Contains the Main Process code.
    *   `main.ts`: Entry point for Electron, handles window creation and lifecycle.
    *   `ipc.ts`: Registers IPC handlers for communication.
    *   `db.ts`: Handles direct SQLite database interactions.
*   **`src/`**: Contains the Renderer Process (Vue application) code.
    *   `views/`: Page-level components (e.g., `DashboardView.vue`).
    *   `components/`: Reusable UI components.
    *   `stores/`: Pinia stores for state management (`finance.ts`).
    *   `composables/`: Shared logic (e.g., `useTransactionActions.ts`).
    *   `utils.ts`: Shared utility functions.

## Prerequisites

*   **Node.js**: Version 24+ is recommended.
*   **npm**: Version 11+ is recommended.

## Getting Started

1.  **Fork and Clone** the repository.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    This starts the Vite dev server and launches the Electron application.

## Available Scripts

Here are the most common scripts you'll use:

*   `npm run dev`: Starts the development server with hot-reload.
*   `npm run lint`: Runs ESLint to fix code style issues.
*   `npm run typecheck`: Runs the TypeScript compiler to check for errors.
*   `npm run build`: Type-checks and builds the application for production.

## Development Workflow

1.  Create a new branch for your feature or bugfix:
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  Make your changes.
3.  **Linting & Type Checking**: Ensure your code passes linting and type checks.
    ```bash
    npm run lint
    npm run typecheck
    ```

## Coding Conventions

*   **Components**: Use Vue 3 `<script setup lang="ts">`.
*   **Imports**: Use the `@` alias (pointing to `src/`) for imports.
*   **Styling**: Prefer Tailwind utility classes. Use PrimeVue components for complex UI elements.
*   **Async Operations**: Handle errors properly (try/catch) within Pinia actions.
*   **Modals**: Use custom `ConfirmationModal.vue` or `ErrorModal.vue` instead of native `window.confirm` or `alert`.
*   **Dates**: Use helper functions in `src/utils.ts` (e.g., `toIsoDateString`) for consistency.

## Pull Request Process

1.  Ensure your code adheres to the coding conventions.
2.  Update documentation if necessary.
3.  Submit a Pull Request (PR) to the `main` branch.
4.  Provide a clear description of the changes and the problem they solve.

## Reporting Bugs & Feature Requests

### Bugs
If you find a bug, please open an issue using the **Bug Report** form. This form helps you provide all the necessary details, such as steps to reproduce, expected behavior, and environment information, ensuring we can address the issue efficiently.

### Feature Requests / Stories
For new features or significant changes, please use the **Development Story** form. This template helps outline the summary, proposed implementation, and acceptance criteria to facilitate a productive discussion before coding begins.


## License

by contributing, you agree that your contributions will be licensed under the MIT License. See [`LICENSE`](LICENSE) for more information.
