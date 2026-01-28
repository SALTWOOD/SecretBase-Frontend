import { defineStore } from "pinia";

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as UserInfo | null,
    isLoggedIn: false
  }),
  actions: {
    setUser(info: UserInfo) {
      this.userInfo = info;
      this.isLoggedIn = true;
    }
  }
});