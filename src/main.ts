import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'

// Create app instance
const app = createApp(App)

// Setup Pinia (State Management)
const pinia = createPinia()
app.use(pinia)

// Setup PrimeVue with Aura theme (Tailwind-compatible)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  },
  ripple: true
})

// Mount the app
app.mount('#app')
