import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAGE_SIZE_LABELS } from '../constants/pageSizes'
import type { PageOrientation, PageSizeKey } from '../constants/pageSizes'
import { useReportPageSetupStore } from '../stores/useReportPageSetupStore'

const SIZE_OPTIONS: PageSizeKey[] = ['A4', 'F4', 'Letter', 'Custom']

/** Dropdown ukuran kertas print-preview laporan — persisted di localStorage, default A4. */
export function PageSetupControl() {
  const { size, orientation, customWidthMm, customHeightMm, setSize, setOrientation, setCustomDimensions } = useReportPageSetupStore()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-[12px]">
          <FileText className="h-3.5 w-3.5" />
          Ukuran Kertas: {PAGE_SIZE_LABELS[size]}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[#64748b]">Ukuran Kertas</Label>
          <Select value={size} onValueChange={(v) => setSize(v as PageSizeKey)}>
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-[12px]">
                  {PAGE_SIZE_LABELS[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium text-[#64748b]">Orientasi</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['portrait', 'landscape'] as PageOrientation[]).map((opt) => (
              <Button
                key={opt}
                type="button"
                size="sm"
                variant={orientation === opt ? 'default' : 'outline'}
                className="h-8 text-[12px]"
                onClick={() => setOrientation(opt)}
              >
                {opt === 'portrait' ? 'Portrait' : 'Landscape'}
              </Button>
            ))}
          </div>
        </div>

        {size === 'Custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#64748b]">Lebar (mm)</Label>
              <Input
                type="number"
                min={50}
                className="h-8 text-[12px]"
                value={customWidthMm}
                onChange={(e) => setCustomDimensions(Number(e.target.value) || customWidthMm, customHeightMm)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-[#64748b]">Tinggi (mm)</Label>
              <Input
                type="number"
                min={50}
                className="h-8 text-[12px]"
                value={customHeightMm}
                onChange={(e) => setCustomDimensions(customWidthMm, Number(e.target.value) || customHeightMm)}
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
