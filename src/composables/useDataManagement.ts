import { toRaw } from "vue";
import { useFinanceStore } from "@/stores/finance";
import { verifyImportData } from "@/utils";

// Interfaces for the modals based on their usage in SettingsView
interface ConfirmationModalInstance {
  openConfirmation(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean>;
}

interface ErrorModalInstance {
  openConfirmation(options: {
    title: string;
    message: string;
    confirmText?: string;
  }): Promise<boolean>;
}

interface NotificationModalInstance {
  openConfirmation(options: {
    title: string;
    message: string;
    confirmText?: string;
  }): Promise<boolean>;
}

interface ImportActionModalInstance {
  openConfirmation(options: {
    title: string;
    message: string;
  }): Promise<{ action: 'replace' | 'append'; skipDuplicates: boolean } | null>;
}

export function useDataManagement() {
  const store = useFinanceStore();

  async function openDbLocation() {
    await window.electronAPI.openDbLocation();
  }

  async function deleteDatabase(
    confirmModal: ConfirmationModalInstance | undefined,
    notificationModal: NotificationModalInstance | undefined,
    errorModal: ErrorModalInstance | undefined
  ) {
    const confirmed = await confirmModal?.openConfirmation({
      title: "⚠️ DELETE DATABASE?",
      message:
        "This will permanently delete all your financial data including:\n- All transactions\n- All accounts\n- All ledger periods.\n\nThe app will close after deletion. Are you sure?",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (confirmed) {
      const success = await window.electronAPI.deleteDatabase();
      if (success) {
        await notificationModal?.openConfirmation({
          title: "Database Deleted",
          message:
            "Database deleted. Please restart the application (run npm run dev).\n",
          confirmText: "Okay",
        });
        window.close();
      } else {
        await errorModal?.openConfirmation({
          title: "Error",
          message: "Failed to delete database. Please try closing the app first.",
          confirmText: "Okay",
        });
      }
    }
  }

  async function exportData(notificationModal: NotificationModalInstance | undefined) {
    const accountsValue = toRaw(store.accounts);
    const transactionsValue = toRaw(store.transactions);
    const categoriesValue = toRaw(store.categories);
    const accountTypesValue = toRaw(store.accountTypes);
    const ledgerYearsValue = toRaw(store.ledgerYears);

    const data = {
      accounts: accountsValue,
      transactions: transactionsValue,
      categories: categoriesValue,
      accountTypes: accountTypesValue,
      ledgerYears: ledgerYearsValue,
    };

    const timestamp = new Date().toDateString();

    const dataStr = JSON.stringify(data, null, 2);

    const result = await window.electronAPI.exportDatabase({
      data: dataStr,
      defaultName: "One-Finance Export " + timestamp,
    });

    if (!result.success) {
      return;
    }

    await notificationModal?.openConfirmation({
      title: "Database Exported",
      message: "A JSON file is available with the data at the location",
      confirmText: "Okay",
    });
  }

  async function importData(
    errorModal: ErrorModalInstance | undefined,
    actionModal: ImportActionModalInstance | undefined,
    notificationModal: NotificationModalInstance | undefined
  ) {
    const result = await window.electronAPI.importDatabase();

    if (!result.success || result.data == undefined) {
      return;
    }

    const verified = verifyImportData(result.data);

    if (!verified) {
      return await errorModal?.openConfirmation({
        title: "Import Error",
        message: "The selected file is not a valid One Finance export file.",
        confirmText: "Okay",
      });
    }

    const response = await actionModal?.openConfirmation({
      title: "Import Data",
      message: "Choose how you want to import the data:",
    });

    if (response) {
      if (response.action === "replace") {
        await store.deleteAllDataFromTables();

        const success = await store.importDatabaseData(result.data, false);

        if (!success) {
          return await errorModal?.openConfirmation({
            title: "Import Error",
            message: "An error occurred while importing data.",
            confirmText: "Okay",
          });
        }
      } else {
        const success = await store.importDatabaseData(
          result.data,
          response.skipDuplicates
        );

        if (!success) {
          return await errorModal?.openConfirmation({
            title: "Import Error",
            message: "An error occurred while importing data.",
            confirmText: "Okay",
          });
        }
      }
    } else {
      return;
    }

    return await notificationModal?.openConfirmation({
      title: "Import Successful",
      message: "Data imported successfully.",
      confirmText: "Okay",
    });
  }

  return {
    openDbLocation,
    deleteDatabase,
    exportData,
    importData,
  };
}
