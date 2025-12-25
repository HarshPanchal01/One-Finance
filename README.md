# One Finance

A local-first personal finance manager built with modern web technologies and Electron.

## Tech Stack

*   **Frontend Framework:** Vue 3 (Script Setup)
*   **Language:** TypeScript
*   **State Management:** Pinia
*   **UI Components:** PrimeVue
*   **Styling:** Tailwind CSS
*   **Desktop Runtime:** Electron
*   **Database:** SQLite (better-sqlite3)
*   **Build Tool:** Vite

## Features

*   **Local-First:** All data is stored locally on your device in a SQLite database.
*   **Dashboard:** View summaries of income, expenses, and balance.
*   **Transactions:** Add, edit, and categorize transactions.
*   **Ledger:** Organize transactions by year and month.
*   **Categories:** Customize categories with icons and colors.
*   **Dark Mode:** Built-in dark mode support.

## How to Run

### Prerequisites

*   Node.js (v16 or higher recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/one-finance.git
    cd one-finance/OneFinance
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To run the application in development mode (with hot-reload):

```bash
npm run dev
```

This will start the Vite development server and launch the Electron app.

### Build

To build the application for production:

```bash
npm run build
```

The build artifacts will be generated in the `dist` and `dist-electron` directories.

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
