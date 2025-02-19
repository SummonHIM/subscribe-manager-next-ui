import { defineStore } from "pinia"

interface NotifyerState {
    open: boolean
    message: string
}

/** 通知存储 */
export const useNotifyerStore = defineStore('theme', {
    state: (): NotifyerState => ({
        open: false,
        message: ""
    }),
    persist: false
})