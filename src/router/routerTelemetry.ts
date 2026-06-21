/**
 * Logger abstraction untuk uncaught route/render error (A13-254).
 *
 * Tujuan:
 * - detail teknis (message, stack, source path) HANYA masuk ke channel log,
 *   tidak pernah dirender ke UI production;
 * - tidak ada integrasi telemetry vendor eksternal tanpa keputusan produk
 *   (lihat issue-27 §16). Saat ini channel = console saja.
 *
 * Jika nanti diputuskan memakai telemetry vendor, ganti implementasi
 * `logRouteError` di sini tanpa mengubah call site.
 */

interface RouteErrorContext {
  /** Lokasi/route tempat error terjadi, jika diketahui. */
  location?: string
  /** Sumber boundary (mis. 'route', 'app-root'). */
  boundary?: string
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

/**
 * Catat error route yang tidak tertangani. Aman dipanggil di production:
 * tidak melempar, tidak mengembalikan detail ke pemanggil untuk dirender.
 */
export function logRouteError(error: unknown, context: RouteErrorContext = {}): void {
  const prefix = `[RouteError]${context.boundary ? ` ${context.boundary}` : ''}`

  if (import.meta.env.DEV) {
    // Dev: tampilkan detail penuh untuk debugging.
    console.error(prefix, context, error)
    return
  }

  // Production: catat ringkas tanpa mengekspos ke UI.
  console.error(prefix, describeError(error))
}
