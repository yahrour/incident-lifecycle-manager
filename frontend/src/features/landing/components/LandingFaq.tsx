import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "../content/faqs";
import { Section } from "./Section";

export function LandingFaq() {
  return (
    <Section eyebrow="FAQ" title="Common questions" width="prose">
      <Accordion>
        {FAQS.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            value={index}
            className="border-b border-border"
          >
            <AccordionTrigger className="items-center py-5 text-[15px] font-medium text-foreground hover:no-underline sm:text-[16px]">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pr-8 pb-5 text-[15px] text-muted-foreground">
              <p className="leading-[1.65]">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
