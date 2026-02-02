import { client } from "@secret-base/api/src/client.gen";

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseUrl: "/api/v1",
  });

  client.interceptors.response.use((response) => {
    if (!response.ok) {
      console.error("Request Error:", response.status);
      useToast().add({
        title: "API Error",
        description: `Status: ${response.status}`,
        color: "error",
      });
    }
    return response;
  });
});
