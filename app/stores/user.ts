import { defineStore } from "pinia";
import type { User } from "~/types/user";

const initialState = {
  user: null as User | null,
  isLoggedIn: false,
};

export const useUserStore = defineStore("user", {
  persist: true,
  state: () => ({ ...initialState }),
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
