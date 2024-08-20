import { expect, test } from "@playwright/test";

test("user should be able to manually save a flow when the auto_save is off", async ({
  page,
}) => {
  // Intercept the request to any base URL ending with /api/v1/config
  await page.route("**/api/v1/config", async (route) => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.auto_saving = false;
    route.fulfill({
      response,
      body: JSON.stringify(responseBody),
      headers: {
        ...response.headers(),
        "content-type": "application/json",
      },
    });
  });

  await page.goto("/");
  await page.locator("span").filter({ hasText: "My Collection" }).isVisible();
  await page.waitForSelector('[data-testid="mainpage_title"]', {
    timeout: 30000,
  });

  await page.waitForSelector('[id="new-project-btn"]', {
    timeout: 30000,
  });

  let modalCount = 0;
  try {
    const modalTitleElement = await page?.getByTestId("modal-title");
    if (modalTitleElement) {
      modalCount = await modalTitleElement.count();
    }
  } catch (error) {
    modalCount = 0;
  }

  while (modalCount === 0) {
    await page.getByText("New Project", { exact: true }).click();
    await page.waitForTimeout(3000);
    modalCount = await page.getByTestId("modal-title")?.count();
  }

  await page.waitForSelector('[data-testid="blank-flow"]', {
    timeout: 30000,
  });

  await page.getByTestId("blank-flow").click();
  await page.waitForSelector('[data-testid="extended-disclosure"]', {
    timeout: 30000,
  });

  await page.getByPlaceholder("Search").click();
  await page.getByPlaceholder("Search").fill("NVIDIA");

  await page.waitForTimeout(1000);

  await page
    .getByTestId("modelsNVIDIA")
    .dragTo(page.locator('//*[@id="react-flow-id"]'));
  await page.mouse.up();
  await page.mouse.down();

  await page.waitForSelector('[title="fit view"]', {
    timeout: 100000,
  });

  await page.getByTitle("fit view").click();

  expect(await page.getByText("Last saved:").isVisible()).toBeTruthy();

  expect(await page.getByTestId("save-flow-button").isEnabled()).toBeTruthy();

  await page.waitForSelector("text=loading", {
    state: "hidden",
    timeout: 100000,
  });

  await page.getByTestId("icon-ChevronLeft").last().click();

  expect(
    await page
      .getByText("Unsaved changes will be permanently lost.")
      .isVisible(),
  ).toBeTruthy();

  await page.getByText("Exit Anyway", { exact: true }).click();

  await page.getByText("Untitled document").first().click();

  await page.waitForSelector('[data-testid="icon-ChevronLeft"]', {
    timeout: 100000,
  });

  expect(await page.getByText("NVIDIA").isVisible()).toBeFalsy();

  await page.getByPlaceholder("Search").click();
  await page.getByPlaceholder("Search").fill("NVIDIA");

  await page.waitForTimeout(1000);

  await page
    .getByTestId("modelsNVIDIA")
    .dragTo(page.locator('//*[@id="react-flow-id"]'));
  await page.mouse.up();
  await page.mouse.down();

  await page.waitForSelector('[title="fit view"]', {
    timeout: 100000,
  });

  await page.getByTitle("fit view").click();

  await page.getByTestId("icon-ChevronLeft").last().click();

  await page.getByText("Save And Exit", { exact: true }).click();

  await page.getByText("Untitled document").first().click();

  await page.waitForSelector("text=loading", {
    state: "hidden",
    timeout: 100000,
  });

  await page.waitForTimeout(5000);

  expect(await page.getByTestId("title-NVIDIA").isVisible()).toBeTruthy();

  await page.getByPlaceholder("Search").click();
  await page.getByPlaceholder("Search").fill("NVIDIA");

  await page.waitForTimeout(1000);

  await page
    .getByTestId("modelsNVIDIA")
    .dragTo(page.locator('//*[@id="react-flow-id"]'));
  await page.mouse.up();
  await page.mouse.down();

  await page.waitForSelector('[title="fit view"]', {
    timeout: 100000,
  });

  await page.getByTitle("fit view").click();

  await page.getByTestId("save-flow-button").click();
  await page.getByTestId("icon-ChevronLeft").last().click();

  await page.getByText("Untitled document").first().click();

  await page.waitForSelector('[data-testid="icon-ChevronLeft"]', {
    timeout: 100000,
  });

  await page.waitForTimeout(5000);

  const nvidiaNumber = await page.getByTestId("title-NVIDIA").count();
  expect(nvidiaNumber).toBe(2);
});
