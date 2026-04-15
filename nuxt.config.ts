// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "nuxt-qrcode",
    "@nuxtjs/mdc",
  ],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    capSecretKey: "",
    public: {
      apiBase: "/api/v1",
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("cap-"),
    },
  },
  qrcode: {
    options: {
      variant: {
        inner: "circle",
        marker: "rounded",
        pixel: "rounded",
      },
      radius: 1,
      blackColor: "currentColor",
      whiteColor: "transparent",
    },
  },
});
