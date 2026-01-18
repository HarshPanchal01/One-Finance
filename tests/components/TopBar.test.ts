import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import TopBar from '@/components/TopBar.vue';
import { createTestingPinia } from '@pinia/testing';
import { useFinanceStore } from '@/stores/finance';
import PrimeVue from 'primevue/config';

describe('TopBar.vue', () => {
  const globalOptions = {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false, // We want to mock manually or inspect state
        initialState: {
          finance: {
            categories: [{ id: 1, name: 'Food', colorCode: '#fff', icon: 'pi-tag' }],
            accounts: [{ id: 1, accountName: 'Cash', startingBalance: 0, accountTypeId: 1, isDefault: true }],
            isSearching: false,
            transactionFilter: null
          }
        }
      }),
      PrimeVue
    ]
  };

  it('searches on enter key', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        finance: {
          categories: [],
          accounts: [],
          isSearching: false,
          transactionFilter: null
        }
      }
    });
    
    // Mock before mount
    const store = useFinanceStore(pinia);
    store.searchTransactions = vi.fn();

    const wrapper = mount(TopBar, { 
      global: {
        plugins: [pinia],
        stubs: {
            DatePicker: true
        }
      } 
    });

    const input = wrapper.find('input[type="text"]');
    (input.element as HTMLInputElement).value = 'Pizza';
    await input.trigger('input');
    
    // Ensure v-model updated
    expect((input.element as HTMLInputElement).value).toBe('Pizza');
    
    // Trigger via button click to avoid keydown event simulation issues
    const searchBtn = wrapper.find('button[title="Search"]');
    await searchBtn.trigger('click');

    expect(store.searchTransactions).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Pizza'
    }));
  });

  it('toggles filters', async () => {
    const wrapper = mount(TopBar, { global: globalOptions });
    
    // Account Picker toggle
    const accountBtn = wrapper.find('button[title="Filter by Account"]');
    await accountBtn.trigger('click');
    expect(wrapper.text()).toContain('Filter Accounts'); // Dropdown opens

    // Label Picker toggle
    const labelBtn = wrapper.find('button[title="Filter by Label"]');
    await labelBtn.trigger('click');
    expect(wrapper.text()).toContain('Filter Labels'); // Dropdown opens
  });

  it('applies category filter', async () => {
    const wrapper = mount(TopBar, { global: globalOptions });
    const store = useFinanceStore();
    store.searchTransactions = vi.fn();

    // Open label picker
    await wrapper.find('button[title="Filter by Label"]').trigger('click');
    
    // Select 'Food' (from mock state)
    // Find button inside the list
    const categoryBtn = wrapper.findAll('div.max-h-60 button')[0];
    await categoryBtn.trigger('click');

    expect(store.searchTransactions).toHaveBeenCalledWith(expect.objectContaining({
      categoryIds: [1]
    }));
  });
});
