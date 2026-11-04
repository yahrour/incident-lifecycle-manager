import { Footer } from "../components/Footer";
import { LegalArticle } from "../components/LegalArticle";
import { TERMS_SECTIONS } from "../content/terms";

export function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <LegalArticle
        title="Terms of Service"
        updated="October 29, 2026"
        sections={TERMS_SECTIONS}
      />
      <Footer />
    </div>
  );
}
