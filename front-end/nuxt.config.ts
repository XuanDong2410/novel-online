// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@vueuse/nuxt',
    '@nuxt/icon',
    '@pinia/nuxt'
  ],

  imports: {
    autoImport: true,
    dirs: ['stores']
  },
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    }
  },
  routeRules: {
    '/api/**': {
      cors: true
    },
    '/api/_nuxt_icon/**': {
      cors: false // Loại trừ endpoint của @nuxt/icon
    }
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-07-11',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
