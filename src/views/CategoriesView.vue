<script setup lang="ts">
import { ref } from "vue";
import { useFinanceStore } from "../stores/finance";
import type { Category } from "../types";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";

const store = useFinanceStore();

const confirmModal = ref<InstanceType<typeof ConfirmationModal>>();

// Modal state
const showModal = ref(false);
const editingCategory = ref<Category | null>(null);

// Form data
const form = ref({
  name: "",
  colorCode: "#6366f1",
  icon: "pi-tag",
});

// Available icons
const icons = [
  "pi-tag",
  "pi-wallet",
  "pi-shopping-cart",
  "pi-car",
  "pi-ticket",
  "pi-shopping-bag",
  "pi-bolt",
  "pi-heart",
  "pi-home",
  "pi-phone",
  "pi-gift",
  "pi-book",
  "pi-briefcase",
  "pi-globe",
  "pi-star",
  "pi-credit-card",
  "pi-chart-line",
  "pi-building",
  "pi-users",
  "pi-ellipsis-h",
];

// Color presets
const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#6b7280",
  "#374151",
  "#1f2937",
];

// Open create modal
function openCreateModal() {
  editingCategory.value = null;
  form.value = {
    name: "",
    colorCode: "#6366f1",
    icon: "pi-tag",
  };
  showModal.value = true;
}

// Open edit modal
function openEditModal(category: Category) {
  editingCategory.value = category;
  form.value = {
    name: category.name,
    colorCode: category.colorCode,
    icon: category.icon,
  };
  showModal.value = true;
}

// Save category
async function saveCategory() {
  if (!form.value.name.trim()) return;

  try {
    if (editingCategory.value) {
      await store.editCategory(
        editingCategory.value.id,
        form.value.name,
        form.value.colorCode,
        form.value.icon
      );
    } else {
      await store.addCategory(
        form.value.name,
        form.value.colorCode,
        form.value.icon
      );
    }
    showModal.value = false;
  } catch (error) {
    console.error("Failed to save category:", error);
  }
}

// Delete category
async function deleteCategory(id: number) {
  if (
    await confirmModal.value?.openConfirmation({
      title: "Delete Category",
      message: "Are you sure you want to delete this category?",
      cancelText: "Cancel",
      confirmText: "Delete",
    }
  )
  ) {
    await store.removeCategory(id);
  }
}

// Close modal
function closeModal() {
  showModal.value = false;
  editingCategory.value = null;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Categories
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ store.categories.length }} categories
        </p>
      </div>

      <button
        class="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        @click="openCreateModal"
      >
        <i class="pi pi-plus mr-2" />
        Add Category
      </button>
    </div>

    <!-- Categories Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="category in store.categories"
        :key="category.id"
        class="group card p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-white"
              :style="{ backgroundColor: category.colorCode }"
            >
              <i :class="['pi text-xl', category.icon]" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ category.name }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ category.colorCode }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="hidden group-hover:flex items-center space-x-1">
            <button
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors"
              title="Edit"
              @click="openEditModal(category)"
            >
              <i class="pi pi-pencil text-sm" />
            </button>
            <button
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-expense transition-colors"
              title="Delete"
              @click="deleteCategory(category.id)"
            >
              <i class="pi pi-trash text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="store.categories.length === 0"
      class="text-center py-12"
    >
      <i class="pi pi-tags text-5xl text-gray-300 dark:text-gray-600 mb-4" />
      <p class="text-lg text-gray-500 dark:text-gray-400">
        No categories yet
      </p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
        Create categories to organize your transactions
      </p>
    </div>

    <!-- Category Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/50"
          @click="closeModal"
        />

        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ editingCategory ? "Edit Category" : "New Category" }}
            </h3>
            <button
              class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              @click="closeModal"
            >
              <i class="pi pi-times" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-4">
            <!-- Preview -->
            <div class="flex justify-center">
              <div
                class="w-16 h-16 rounded-xl flex items-center justify-center text-white"
                :style="{ backgroundColor: form.colorCode }"
              >
                <i :class="['pi text-2xl', form.icon]" />
              </div>
            </div>

            <!-- Name -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Food & Dining"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Color -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Color
              </label>
              <div class="grid grid-cols-10 gap-2">
                <button
                  v-for="color in colors"
                  :key="color"
                  :class="[
                    'w-6 h-6 rounded-full transition-transform',
                    form.colorCode === color
                      ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                      : 'hover:scale-110',
                  ]"
                  :style="{ backgroundColor: color }"
                  @click="form.colorCode = color"
                />
              </div>
            </div>

            <!-- Icon -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Icon
              </label>
              <div class="grid grid-cols-10 gap-2">
                <button
                  v-for="icon in icons"
                  :key="icon"
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    form.icon === icon
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                  ]"
                  @click="form.icon = icon"
                >
                  <i :class="['pi text-sm', icon]" />
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              @click="closeModal"
            >
              Cancel
            </button>
            <button
              :disabled="!form.name.trim()"
              class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              @click="saveCategory"
            >
              {{ editingCategory ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <ConfirmationModal ref="confirmModal" />
  <ErrorModal ref="errorModal" />
</template>
