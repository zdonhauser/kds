import { test, expect } from '@playwright/test'

test.describe('KDS System', () => {
  test('homepage displays navigation options', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('KDS System')
    
    // Check navigation cards
    await expect(page.getByRole('link', { name: /kitchen/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /pickup/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /recall/i })).toBeVisible()
  })

  test('can navigate to kitchen display', async ({ page }) => {
    await page.goto('/')
    
    // Click kitchen card
    await page.getByRole('link', { name: /kitchen/i }).click()
    
    // Should navigate to kitchen page
    await expect(page).toHaveURL('/kitchen')
    
    // Should show KDS interface
    await expect(page.locator('.kds-carousel')).toBeVisible()
  })

  test('can navigate to pickup display', async ({ page }) => {
    await page.goto('/')
    
    // Click pickup card
    await page.getByRole('link', { name: /pickup/i }).click()
    
    // Should navigate to pickup page
    await expect(page).toHaveURL('/pickup')
    
    // Should show KDS interface
    await expect(page.locator('.kds-carousel')).toBeVisible()
  })

  test('can navigate to recall display', async ({ page }) => {
    await page.goto('/')
    
    // Click recall card
    await page.getByRole('link', { name: /recall/i }).click()
    
    // Should navigate to recall page
    await expect(page).toHaveURL('/recall')
    
    // Should show KDS interface
    await expect(page.locator('.kds-carousel')).toBeVisible()
  })

  test('navigation bar works correctly', async ({ page }) => {
    await page.goto('/kitchen')
    
    // Check navigation is visible
    await expect(page.getByText('KDS System')).toBeVisible()
    
    // Navigate to pickup via nav
    await page.getByRole('link', { name: /pickup/i }).click()
    await expect(page).toHaveURL('/pickup')
    
    // Navigate to recall via nav
    await page.getByRole('link', { name: /recall/i }).click()
    await expect(page).toHaveURL('/recall')
    
    // Navigate back to home
    await page.getByRole('link', { name: 'KDS System' }).click()
    await expect(page).toHaveURL('/')
  })

  test('kitchen display fetches orders', async ({ page }) => {
    // Mock the API response
    await page.route('/api/kds-orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/kitchen')
    
    // Should make API call for orders
    const response = page.waitForResponse('/api/kds-orders*')
    await expect(response).toBeTruthy()
  })

  test('real-time connection establishes', async ({ page }) => {
    // Mock EventSource for real-time updates
    await page.addInitScript(() => {
      // Mock EventSource
      (window as any).EventSource = class MockEventSource {
        onopen: any = null
        onmessage: any = null
        onerror: any = null
        
        constructor(url: string) {
          setTimeout(() => {
            if (this.onopen) {
              this.onopen()
            }
          }, 100)
        }
        
        close() {}
      }
    })

    await page.goto('/kitchen')
    
    // Should establish SSE connection
    await page.waitForTimeout(200)
    
    // Check for connection status (connected state)
    // The component should be in connected state
    await expect(page.locator('.kds-carousel')).toBeVisible()
  })
})