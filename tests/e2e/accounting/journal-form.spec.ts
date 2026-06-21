import { test, expect, seedAuth, mockApi } from '../fixtures/test'

test.describe('Phase 26 Slice A — journal form', () => {
  test('form jurnal menampilkan dimensi Departemen/Proyek dan memvalidasi line kosong', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)

    await page.goto('/accounting/journals/create')
    await expect(page.getByText('Baris Jurnal')).toBeVisible()

    // A13-053 — kolom dimensi tersedia pada line jurnal.
    await expect(page.getByText(/departemen/i).first()).toBeVisible()
    await expect(page.getByText(/proyek/i).first()).toBeVisible()

    // A13-054 — submit tanpa akun memunculkan error per baris, bukan hanya toast global.
    await page.getByRole('button', { name: 'Simpan Draft' }).click()
    await expect(page.getByText('Akun wajib dipilih').first()).toBeVisible()
  })

  test('draft create jurnal dipulihkan setelah meninggalkan form (A13-055)', async ({ page }) => {
    await seedAuth(page)
    await mockApi(page)

    await page.goto('/accounting/journals/create')
    await page.getByLabel('Deskripsi').fill('AUDIT draft jurnal')
    await page.waitForTimeout(900) // lewati debounce draft

    await page.goto('/accounting/journals')
    await page.goto('/accounting/journals/create')

    await expect(page.getByLabel('Deskripsi')).toHaveValue('AUDIT draft jurnal')
  })
})
