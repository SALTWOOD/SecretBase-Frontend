// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore();

  const privatePages = ["/dash"];
  const isProtected = privatePages.some(
    (prefix) => to.path === prefix || to.path.startsWith(`${prefix}/`),
  );

  if (!userStore.isLoggedIn && isProtected) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }
});
