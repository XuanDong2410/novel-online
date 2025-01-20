// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true }, // Bat cong cu phat trien

  // Cấu hình runtime
  runtimeConfig: {
    apiSecret: '123', // Khoa chỉ danh cho server-side
    public: {
      apiBase: '/api', // Khoa danh cho client-side
    },
  },

  // Cấu hình Vite
  vite: {
    vue: {
      customElement: true, // Hỗ trợ custom elements
    },
    vueJsx: {
      mergeProps: true, // Hỗ trợ merge props trong JSX
    },
  },

  // Cấu hình Webpack (nếu bạn sử dụng Webpack thay vì Vite)
  webpack: {
    loaders: {
      vue: {
        hotReload: true, // Bật chế độ tải lại nóng
      },
    },
  },
  build: {
    transpile: ['lucide-vue-next']
  },
  // Cấu hình Vue
  vue: {
    propsDestructure: true, // Tự động destructure props
  },

  // Cấu hình cho từng môi trường
  app: {
    baseURL: '/', // Đường dẫn gốc cho ứng dụng
    buildAssetsDir: '/_nuxt/', // Đường dẫn assets được build
  },

  // Logic cho các môi trường
  routeRules: process.env.NODE_ENV === 'production'
    ? {
        '/**': { isr: true }, // Sử dụng ISR (Incremental Static Regeneration) trong production
      }
    : {},


});

