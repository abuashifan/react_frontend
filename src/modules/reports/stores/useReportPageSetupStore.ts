import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PageOrientation, PageSizeKey } from '../constants/pageSizes'

interface ReportPageSetupState {
  size: PageSizeKey
  orientation: PageOrientation
  customWidthMm: number
  customHeightMm: number

  setSize: (size: PageSizeKey) => void
  setOrientation: (orientation: PageOrientation) => void
  setCustomDimensions: (widthMm: number, heightMm: number) => void
}

export const useReportPageSetupStore = create<ReportPageSetupState>()(
  persist(
    (set) => ({
      size: 'A4',
      orientation: 'portrait',
      customWidthMm: 210,
      customHeightMm: 297,

      setSize: (size) => set({ size }),
      setOrientation: (orientation) => set({ orientation }),
      setCustomDimensions: (customWidthMm, customHeightMm) => set({ customWidthMm, customHeightMm }),
    }),
    {
      name: 'seaside-report-page-setup',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
