import { Footer } from "../components/Footer";
import { LegalArticle } from "../components/LegalArticle";
import { PRIVACY_SECTIONS } from "../content/privacy";

export function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <LegalArticle
        title="Privacy Policy"
        updated="October 29, 2026"
        sections={PRIVACY_SECTIONS}
      />
      <Footer />
    </div>
  );
}
