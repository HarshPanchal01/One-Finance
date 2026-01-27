<script setup lang="ts">

import { Category } from '@/types';
import { ref } from 'vue';

const props = defineProps<{
  editingCategory: Category | null;
}>();

const emit = defineEmits<{
  (e: 'closeCategoryModal'): void;
  (e: 'saveCategory', categoryForm: { name: string; colorCode: string; icon: string }): void;
}>();


const categoryForm = ref({
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

// Save category

</script>


<template> 
    <Teleport to="body">
        <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        >
        <div
            class="absolute inset-0 bg-black/50"
            @click="$emit('closeCategoryModal')"
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
                @click="$emit('closeCategoryModal')"
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
                :style="{ backgroundColor: categoryForm.colorCode }"
                >
                <i :class="['pi text-2xl', categoryForm.icon]" />
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
                v-model="categoryForm.name"
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
                    categoryForm.colorCode === color
                        ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                        : 'hover:scale-110',
                    ]"
                    :style="{ backgroundColor: color }"
                    @click="categoryForm.colorCode = color"
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
                    categoryForm.icon === icon
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                    ]"
                    @click="categoryForm.icon = icon"
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
                @click="$emit('closeCategoryModal')"
            >
                Cancel
            </button>
            <button
                :disabled="!categoryForm.name.trim()"
                class="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                @click="$emit('saveCategory', categoryForm)"
            >
                {{ editingCategory ? "Update" : "Create" }}
            </button>
            </div>
        </div>
        </div>
    </Teleport>
</template>