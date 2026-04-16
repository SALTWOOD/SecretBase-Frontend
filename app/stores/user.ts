import { defineStore } from "pinia";
import type { User } from "~/types/user";

export const useUserStore = defineStore("user", {
  persist: true,
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
  }),
  actions: {
    setUser(info: User) {
      this.user = info;
      this.isLoggedIn = true;
    },
    reset() {
      this.user = null;
      this.isLoggedIn = false;
    },
  },
});
