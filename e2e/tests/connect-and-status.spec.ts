import { expect, test } from '@playwright/test';

test('check resource names and multiple statuses', async ({ page }) => {
  await page.goto('/');

  // see server_config.json for configuration
  const resourceNames = page
    .getByTestId('resource-names')
    .getByTestId('resource-name');
  await expect(resourceNames).toHaveCount(4);
  await expect(resourceNames.getByText('base1')).toHaveCount(1);
  await expect(resourceNames.getByText('servo1')).toHaveCount(1);
  await expect(resourceNames.getByText('builtin')).toHaveCount(2);

  // 3 status iterations * 4 resource names (see main.ts for loop)
  const statuses = page.getByTestId('statuses').getByTestId('status');
  await expect(statuses).toHaveCount(12);
});
