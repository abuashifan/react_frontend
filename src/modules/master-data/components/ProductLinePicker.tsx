import { cn } from '@/lib/utils'

/** Sel produk di tabel baris: tombol yang membuka dialog, bukan dropdown selebar sel. */
export function ProductPickCell({
  product,
  disabled,
  onClick,
  error,
}: {
  product?: { code: string; name: string } | null
  disabled?: boolean
  onClick: () => void
  error?: string
}) {
  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'flex h-8 w-full items-center truncate px-2 text-left text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5c9ead]/40 disabled:cursor-not-allowed',
          product ? 'text-[#24323a]' : 'text-[#94a3b8]',
        )}
      >
        {product ? `${product.code ? `${product.code} - ` : ''}${product.name}` : 'Pilih produk...'}
      </button>
      {error && <p className="mt-0.5 text-[10px] text-red-500">{error}</p>}
    </div>
  )
}
