import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("painel, perfil e privacidade sem violações WCAG A/AA detectadas", async ({
  page,
}) => {
  await page.goto("/");
  for (const screen of ["painel", "perfil", "privacidade"]) {
    if (screen === "perfil") {
      await page
        .getByRole("button", { name: "Somente essenciais", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Ver perfil de Ana Clara Martins",
          exact: true,
        })
        .click();
    }
    if (screen === "privacidade")
      await page
        .getByRole("button", { name: "Privacidade", exact: true })
        .click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      screen,
    ).toEqual([]);
  }
});
