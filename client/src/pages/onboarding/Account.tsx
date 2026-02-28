import { useState } from "react";
import { useLocation } from "wouter";

const ROL_OPTIONS = [
  "Ouder",
  "Samengesteld ouder",
  "Pleegouder",
  "Verzorger",
  "Anders",
];

interface Kind {
  naam: string;
  leeftijd: string;
}

export default function Account() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [kinderen, setKinderen] = useState<Kind[]>([{ naam: "", leeftijd: "" }]);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addKind = () => {
    if (kinderen.length < 5) {
      setKinderen([...kinderen, { naam: "", leeftijd: "" }]);
    }
  };

  const updateKind = (index: number, field: keyof Kind, value: string) => {
    const updated = [...kinderen];
    updated[index] = { ...updated[index], [field]: value };
    setKinderen(updated);
  };

  const handleFinish = () => {
    if (!name.trim()) {
      alert("Vul je voornaam in om verder te gaan.");
      return;
    }

    if (email && !validateEmail(email)) {
      alert("Vul een geldig e-mailadres in of laat het veld leeg.");
      return;
    }

    const existingProfile = localStorage.getItem("matti_user_profile");
    let userId = `user_${Date.now()}`;
    if (existingProfile) {
      try {
        const parsed = JSON.parse(existingProfile);
        if (parsed.id) userId = parsed.id;
      } catch (e) {
        console.error("Failed to parse existing profile", e);
      }
    }

    const profile = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      rol,
      kinderen: kinderen.filter((k) => k.naam.trim()),
      analyticsConsent,
      themeSuggestionsEnabled: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("matti_user_profile", JSON.stringify(profile));

    setLocation("/chat");
  };

  const isFormValid = name.trim() && (!email || validateEmail(email));

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Account aanmaken
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Vertel iets over jouw gezinssituatie, zodat Opvoedmaatje beter kan meedenken.
          </p>
        </div>

        {/* Voornaam */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Jouw voornaam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijvoorbeeld: Ellen"
            maxLength={50}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* E-mail */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            E-mailadres (optioneel)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bijvoorbeeld@email.nl"
            maxLength={100}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Voor account herstel (optioneel)
          </p>
        </div>

        {/* Rol */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Wat is jouw rol?
          </label>
          <div className="flex flex-col gap-2">
            {ROL_OPTIONS.map((optie) => (
              <button
                key={optie}
                onClick={() => setRol(optie)}
                className={`bg-card border-2 ${
                  rol === optie ? "border-primary bg-primary/5" : "border-border"
                } rounded-xl px-4 py-3 text-left hover:bg-muted transition-colors`}
              >
                <span
                  className={`text-base font-semibold ${
                    rol === optie ? "text-primary" : "text-foreground"
                  }`}
                >
                  {optie}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Kinderen */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Kind(eren)
          </label>
          <div className="space-y-3">
            {kinderen.map((kind, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={kind.naam}
                  onChange={(e) => updateKind(index, "naam", e.target.value)}
                  placeholder="Naam"
                  maxLength={30}
                  className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="number"
                  value={kind.leeftijd}
                  onChange={(e) => updateKind(index, "leeftijd", e.target.value)}
                  placeholder="Leeftijd"
                  min={0}
                  max={25}
                  className="w-28 bg-card border border-border rounded-2xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
          {kinderen.length < 5 && (
            <button
              onClick={addKind}
              className="mt-3 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              + Kind toevoegen
            </button>
          )}
        </div>

        {/* Privacy consent */}
        <div className="mb-8">
          <button
            onClick={() => setAnalyticsConsent(!analyticsConsent)}
            className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 w-full text-left hover:bg-muted transition-colors"
          >
            <div
              className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                analyticsConsent
                  ? "border-primary bg-primary"
                  : "border-muted-foreground bg-background"
              }`}
            >
              {analyticsConsent && (
                <span className="text-primary-foreground font-bold text-sm">✓</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">
                Opvoedmaatje gebruikt anonieme gegevens om de app te verbeteren.
                Je naam en gesprekken worden <span className="font-bold">nooit</span> gedeeld.
              </p>
            </div>
          </button>
        </div>

        {/* Submit */}
        <div className="mt-8 mb-4">
          <button
            onClick={handleFinish}
            disabled={!isFormValid}
            className={`w-full bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-full ${
              !isFormValid ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            } transition-opacity`}
          >
            Start gesprek
          </button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            * = Verplicht veld
          </p>
        </div>

        <div className="h-32" />
      </div>
    </div>
  );
}
