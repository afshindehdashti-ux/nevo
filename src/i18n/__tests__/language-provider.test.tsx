import { afterEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { useTranslation } from "react-i18next";

import i18n from "../config";
import { LanguageProvider } from "../LanguageProvider";

function TranslationProbe() {
  const { t } = useTranslation();
  return <span>{t("home.aiLauncher.askEngineer")}</span>;
}

describe("LanguageProvider", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("uses the URL locale for the first render when a different locale was restored", async () => {
    await i18n.changeLanguage("fa");

    const html = renderToString(
      <LanguageProvider initialLang="en">
        <TranslationProbe />
      </LanguageProvider>,
    );

    expect(html).toContain("Ask NEVO AI Engineer");
    expect(html).not.toContain("از مهندس هوش مصنوعی NEVO بپرسید");
  });
});
