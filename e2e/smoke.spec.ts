import { test, expect } from '@playwright/test';

test('loads the app and shows the title and disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Anatomy Motion Explorer' })).toBeVisible();
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
});

test('searching for a Latin name reveals the structure', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('musculus biceps');
  await expect(page.getByText('Biceps brachii')).toBeVisible();
});

test('selecting the biceps from search shows its details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('biceps');
  await page.getByRole('button', { name: /Biceps brachii/i }).click();
  await expect(page.getByRole('heading', { name: 'Biceps brachii' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Triceps brachii' })).toBeVisible();
});
