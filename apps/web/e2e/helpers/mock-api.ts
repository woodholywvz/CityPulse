import type { Page, Route } from "@playwright/test";

type JsonHandler = {
  method?: string;
  url: RegExp;
  response: unknown | ((route: Route) => Promise<unknown> | unknown);
  status?: number;
};

export async function mockApi(page: Page, handlers: JsonHandler[]) {
  await page.route("http://localhost:8000/**", async (route) => {
    const request = route.request();
    const handler = handlers.find((candidate) => {
      const methodMatches = candidate.method
        ? candidate.method.toUpperCase() === request.method().toUpperCase()
        : true;
      return methodMatches && candidate.url.test(request.url());
    });

    if (!handler) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "not_mocked",
            message: `No mock registered for ${request.method()} ${request.url()}`,
          },
        }),
      });
      return;
    }

    const payload =
      typeof handler.response === "function"
        ? await handler.response(route)
        : handler.response;

    await route.fulfill({
      status: handler.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export async function seedSession(page: Page, token: string) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("citypulse.auth", JSON.stringify({ token: value }));
  }, token);
}
