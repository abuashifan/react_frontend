/** Viewport matrix canonical Audit-13 (lihat spec-23 / issue-27 §9.4). */
export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1180, height: 708 },
  small: { width: 1024, height: 656 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportKey = keyof typeof VIEWPORTS
