import { useLocation } from "wouter";
import mattiAvatar from "@/assets/matti-avatar.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">👋</div>
            <h1 className="text-3xl font-bold text-foreground text-center">
              Welkom bij Matti!
            </h1>
          </div>

          {/* Visual */}
          <div className="flex justify-center">
            <div className="w-64 h-64 rounded-full shadow-lg border border-border overflow-hidden" aria-label="Welkom illustratie">
              <img src={mattiAvatar} alt="Matti" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Main Content - Accordion */}
          <div className="w-full rounded-2xl p-4 shadow-xl border border-border bg-card">
            <Accordion type="multiple" className="w-full space-y-2">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                  <span className="flex items-center gap-2 text-primary">
                    <span>💬</span> Wat doet Matti?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground pt-1">
                  Matti is een AI chatbuddy voor jongeren (12-21 jaar). Je kunt met Matti praten over alles wat je bezighoudt, zonder oordeel. Matti luistert, geeft tips en helpt je stappen te zetten.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-none">
                <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                  <span className="flex items-center gap-2 text-primary">
                    <span>🗨️</span> Waarover kun je praten?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground pt-1">
                  <div className="space-y-0.5">
                    <p><span className="font-semibold text-foreground">🏫 School:</span> Faalangst, tentamens, concentratie</p>
                    <p><span className="font-semibold text-foreground">👫 Vrienden:</span> Ruzie, pesten, vriendschap</p>
                    <p><span className="font-semibold text-foreground">🏠 Thuis:</span> Ouders, gezin, scheiding</p>
                    <p><span className="font-semibold text-foreground">💖 Gevoelens:</span> Angst, stress, somberheid</p>
                    <p><span className="font-semibold text-foreground">❤️ Liefde:</span> Relaties, heartbreak</p>
                    <p className="text-xs text-muted-foreground mt-1">🔒 Alles blijft privé. Matti geeft praktische tips en checkt later hoe het gaat.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Primary Button */}
            <button
              onClick={() => setLocation("/onboarding/account")}
              className="bg-primary text-primary-foreground text-xl font-bold py-4 px-8 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Lets Talk
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => setLocation("/parent-info")}
              className="bg-card text-foreground text-base font-semibold py-4 px-8 rounded-2xl border-2 border-border hover:bg-muted transition-colors"
            >
              Meer info voor ouders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
