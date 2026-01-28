<script setup lang="ts">
import { ref } from "vue";
import { useFinanceStore } from "@/stores/finance";
import type { AccountType, Category } from "@/types";
import ConfirmationModal from "@/components/ConfirmationModal.vue";
import ErrorModal from "@/components/ErrorModal.vue";
import CategoryModal from "./components/CategoryModal.vue";
import AccountTypeModal from "./components/AccountTypeModal.vue";

const store = useFinanceStore();

const confirmModal = ref<InstanceType<typeof ConfirmationModal>>();

const showAccountTypeModal = ref(false);
const showCategoryModal = ref(false);
const editingCategory = ref<Category | null>(null);
const editingAccountType = ref<AccountType | null>(null);

const categoryForm = ref<
  Category
>({
  id: 0,
  name: "",
  colorCode: "",
  icon: "",
});

const accountTypeForm = ref<{
  type: string;
}>({
  type: "",
});

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

async function deleteAccountType(id: number) {
  if (
    await confirmModal.value?.openConfirmation({
      title: "Delete Account Type",
      message: "Are you sure you want to delete this account type?",
      cancelText: "Cancel",
      confirmText: "Delete",
    }
  )
  ) {
    // Implement account type deletion logic here
  }
}

// Open create modal
function openCategoryCreateModal() {
  editingCategory.value = null;
  categoryForm.value = {
    id: 0,
    name: "",
    colorCode: "#6366f1",
    icon: "pi-tag",
  };
  showCategoryModal.value = true;
}

// Open edit modal
function openCategoryEditModal(category: Category) {
  editingCategory.value = category;
  categoryForm.value = category;
  showCategoryModal.value = true;
}

async function saveCategory(categoryForm: { name: string; colorCode: string; icon: string }) {
  if (!categoryForm.name.trim()) return;

  try {
    if (editingCategory.value) {
      await store.editCategory(
        editingCategory.value.id,
        categoryForm.name,
        categoryForm.colorCode,
        categoryForm.icon
      );
    } else {
      await store.addCategory(
        categoryForm.name,
        categoryForm.colorCode,
        categoryForm.icon
      );
    }
    showCategoryModal.value = false;
  } catch (error) {
    console.error("Failed to save category:", error);
  }
}

// Close modal
function closeCategoryModal() {
  showCategoryModal.value = false;
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
        @click="openCategoryCreateModal"
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
              @click="openCategoryEditModal(category)"
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

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Account Types
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ store.categories.length }} account types
        </p>
      </div>

      <button
        class="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        @click="openCategoryCreateModal"
      >
        <i class="pi pi-plus mr-2" />
        Add Account Type
      </button>
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
  </div>

  <CategoryModal
    v-if="showCategoryModal"
    :editingCategory="categoryForm"
    @closeCategoryModal="closeCategoryModal"
    @saveCategory="saveCategory"
  />
  <AccountTypeModal
    v-if="showAccountTypeModal"
    :editingAccountType="editingAccountType"
    @closeAccountTypeModal="showAccountTypeModal = false"
    @saveAccountType="console.log('Save account type')"
  />

  <ConfirmationModal ref="confirmModal" />
  <ErrorModal ref="errorModal" />
</template>
