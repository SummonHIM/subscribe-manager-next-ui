import type { ConverterOptions } from "@/interfaces"
import { defineStore } from "pinia"

export const useConvertedUrlsStore = defineStore('convertedUrls', {
  state: (): Record<string, ConverterOptions> => ({}),
  persist: true
})