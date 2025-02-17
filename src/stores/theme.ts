import { defineStore } from "pinia"

interface ThemeState {
    theme: "auto" | "light" | "dark"
}

export const useThemeStore = defineStore('theme', {
    state: (): ThemeState => ({
        theme: "auto"
    }),
    persist: true
})