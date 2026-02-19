import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#91ecee'}}>
      <div className="max-w-2xl w-full">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl">👋</div>
            <h1 className="text-3xl font-bold text-foreground text-center" style={{color: '#523fde'}}>
              Welkom bij Matti!
            </h1>
          </div>

          {/* Visual */}
          <div className="flex justify-center">
            <div className="w-64 h-64 rounded-full shadow-lg bg-white/80 flex items-center justify-center text-7xl" aria-label="Welkom illustratie">
              🙂
            </div>
          </div>

          {/* Main Content - Accordion */}
          <div className="w-full rounded-2xl p-4 shadow-xl border border-white/50" style={{backgroundColor: '#98fbeb'}}>
            <Accordion type="multiple" className="w-full space-y-2">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                  <span className="flex items-center gap-2" style={{color: '#3257ec'}}>
                    <span>💬</span> Wat doet Matti?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-gray-800 pt-1">
                  Matti is een AI chatbuddy voor jongeren (12-21 jaar). Je kunt met Matti praten over alles wat je bezighoudt, zonder oordeel. Matti luistert, geeft tips en helpt je stappen te zetten.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-none">
                <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                  <span className="flex items-center gap-2" style={{color: '#5f4cf0'}}>
                    <span>🗨️</span> Waarover kun je praten?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-gray-800 pt-1">
                  <div className="space-y-0.5">
                    <p><span className="font-semibold text-[#3b82f6]">🏫 School:</span> Faalangst, tentamens, concentratie</p>
                    <p><span className="font-semibold text-[#10b981]">👫 Vrienden:</span> Ruzie, pesten, vriendschap</p>
                    <p><span className="font-semibold text-[#f97316]">🏠 Thuis:</span> Ouders, gezin, scheiding</p>
                    <p><span className="font-semibold text-[#ec4899]">💖 Gevoelens:</span> Angst, stress, somberheid</p>
                    <p><span className="font-semibold text-[#ef4444]">❤️ Liefde:</span> Relaties, heartbreak</p>
                    <p className="text-xs text-gray-600 mt-1">🔒 Alles blijft privé. Matti geeft praktische tips en checkt later hoe het gaat.</p>
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
              className="font-bold py-[18px] px-8 rounded-2xl hover:opacity-90 transition-opacity" style={{backgroundColor: '#1ef1bc', color: '#3d52f0', fontSize: '25px', paddingTop: '15px', paddingRight: '15px'}}
            >
              Lets Talk
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => setLocation("/parent-info")}
              className="bg-white text-[#6366f1] text-base font-semibold py-4 px-8 rounded-2xl border-2 border-[#e5e7eb] hover:opacity-70 transition-opacity"
            >
              Meer info voor ouders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
