// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  app: {
    head: {
      htmlAttrs: { lang: "zh-CN" },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "SecretBase",
      meta: [
        { name: "description", content: "SecretBase - A modern community platform" },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "SecretBase" },
        { property: "og:description", content: "SecretBase - A modern community platform" },
        { property: "og:image", content: "/og-image.png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "SecretBase" },
        { name: "twitter:description", content: "SecretBase - A modern community platform" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "nuxt-qrcode",
    "@nuxtjs/mdc",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
  ],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    capSecretKey: process.env.NUXT_CAP_SECRET_KEY,
    apiBase: process.env.NUXT_API_BASE,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
    },
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith("cap-"),
    },
  },
  sitemap: {
    exclude: ["/dash/**", "/auth/**", "/api/**"],
  },
  robots: {
    disallow: ["/dash/", "/auth/", "/api/"],
  },
  routeRules: {
    "/dash/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
    "/auth/**": {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
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
