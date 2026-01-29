// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    capSecretKey: ''
  },
  routeRules: {
    '/api/v1/**': {
      proxy: 'http://localhost:5170/**'
    }
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('cap-')
    }
  }
})
