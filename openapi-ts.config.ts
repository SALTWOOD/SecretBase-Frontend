import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:5170/openapi/v1.json",
  output: {
    format: "prettier",
    lint: "eslint",
    path: "./packages/api/src",
  },
  plugins: [
    "@hey-api/schemas",
    {
      name: "@hey-api/client-fetch",
      baseUrl: "/api/v1",
    },
    {
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    {
      dates: true,
      name: "@hey-api/transformers",
    },
    {
      name: "@hey-api/sdk",
      transformer: true,
    },
  ],
});
