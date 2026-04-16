import { getUserProfile } from "~~/packages/api/src/sdk.gen";
import type { User } from "~/types/user";

const protectedPrefixes = ["/dash"];

function isProtectedRoute(path: string): boolean {
  return protectedPrefixes.some((prefix) => path.startsWith(prefix));
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!isProtectedRoute(to.path)) return;

  const userStore = useUserStore();
  if (userStore.isLoggedIn) return;

  return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
});
