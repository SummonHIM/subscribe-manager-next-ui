import { defineStore } from "pinia"

interface NotifyerState {
    open: boolean
    message: string
}

export const useNotifyerStore = defineStore('theme', {
    state: (): NotifyerState => ({
        open: false,
        message: ""
    }),
    persist: false
})