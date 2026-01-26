# OneFinance

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

## Core Features

### Holistic Financial Dashboard
**Gain immediate clarity on your fiscal health.** The dashboard provides a high-level synthesis of your income, expenditures, and net balance, allowing for informed decision-making at a glance.

![Financial Dashboard](/gifs/Dashboard-ezgif.com-video-to-gif-converter.gif)

---

### Seamless Transaction Management
**Maintain an immutable record of your spending.** Effortlessly log, modify, and classify transactions to ensure your financial history is accurate and comprehensive.

![Transaction Management](/gifs/transactions-ezgif.com-video-to-gif-converter.gif)

---

### Structured Ledger Organization
**Archive your data with temporal precision.** Organize your financial records into chronological ledgers, making it simple to audit specific months or fiscal years without data clutter.

![Ledger Organization](/gifs/createledgers-ezgif.com-video-to-gif-converter.gif)


---

### Advanced Label Filtering
**Navigate complex datasets with ease.** Utilize granular label filtering to isolate specific transaction types or projects, ensuring the data you need is always within reach.

![Label Filtering](/gifs/Filterbylable-ezgif.com-video-to-gif-converter.gif)


---

### Sophisticated Data Analytics
**Transform raw numbers into actionable insights.** Access personalized analytics that visualize spending patterns and trends, helping you identify opportunities for optimization.

![Data Analytics](/gifs/analytics.gif)

---

### Customizable Categorization
**Tailor the interface to your lifestyle.** Define your own spending categories with unique iconography and color-coding, creating a personalized visual language for your budget.

![Custom Categories](/gifs/addCategories-ezgif.com-video-to-gif-converter.gif)

---

### Multi-Account Tracking
**Centralize your fragmented funds.** Create and monitor multiple accounts within a single interface to maintain a unified view of your total liquidity across various platforms.

![Account Tracking](/gifs/createAccounts-ezgif.com-video-to-gif-converter.gif)

---

> **Note on Privacy:** This application operates on a **Local-First** architecture. All financial data is persisted strictly within a local SQLite database, ensuring your sensitive information never leaves your device.

## Installation

You can download the latest version from the [Releases](https://github.com/HarshPanchal01/One-Finance/releases) page.

*   **Linux:** Download the `.AppImage` file.
*   **Windows:** Download the `.exe` installer.
*   **macOS:** We currently do not support macOS binaries. Please clone the repository and build it yourself.

## Development

### Prerequisites

*   Node.js (v24+ recommended)
*   npm

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/HarshPanchal01/One-Finance.git
    cd One-Finance/
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

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

You can find the built application in the `release/` directory.

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
