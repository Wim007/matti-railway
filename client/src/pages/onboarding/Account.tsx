import { useState } from "react";
import { useLocation } from "wouter";
import { AGE_RANGE, GENDER_OPTIONS } from "@shared/matti-types";

export default function Account() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePostalCode = (code: string): boolean => {
    const postalCodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
    return postalCodeRegex.test(code.toUpperCase().replace(/\s/g, ""));
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

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < AGE_RANGE.MIN || ageNum > AGE_RANGE.MAX) {
      alert(`Voer een leeftijd in tussen ${AGE_RANGE.MIN} en ${AGE_RANGE.MAX} jaar.`);
      return;
    }

    if (!postalCode.trim()) {
      alert("Vul je postcode in om verder te gaan.");
      return;
    }

    if (!validatePostalCode(postalCode)) {
      alert("Vul een geldige Nederlandse postcode in (bijv. 1234AB).");
      return;
    }

    // Mock: Save to localStorage
    // Reuse existing ID if profile already exists, otherwise generate new one
    const existingProfile = localStorage.getItem("matti_user_profile");
    let userId = `user_${Date.now()}`;
    if (existingProfile) {
      try {
        const parsed = JSON.parse(existingProfile);
        if (parsed.id) {
          userId = parsed.id;
        }
      } catch (e) {
        console.error("Failed to parse existing profile", e);
      }
    }
    
    const profile = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      age: ageNum,
      birthYear: new Date().getFullYear() - ageNum,
      postalCode: postalCode.toUpperCase().replace(/\s/g, ""),
      gender: selectedGender,
      analyticsConsent,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("matti_user_profile", JSON.stringify(profile));

    setLocation("/chat");
  };

  const isFormValid =
    name.trim() &&
    age &&
    postalCode.trim() &&
    (!email || validateEmail(email)) &&
    validatePostalCode(postalCode);

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Account aanmaken
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Vertel me iets over jezelf zodat ik je beter kan helpen 😊
          </p>
        </div>

        {/* Name Field */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Voornaam *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bijvoorbeeld: Lisa"
            maxLength={50}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Email Field */}
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

        {/* Age Field */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Leeftijd *
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Bijvoorbeeld: 16"
            maxLength={2}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Tussen {AGE_RANGE.MIN} en {AGE_RANGE.MAX} jaar
          </p>
        </div>

        {/* Postal Code Field */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Postcode *
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
            placeholder="Bijvoorbeeld: 1234AB"
            maxLength={7}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Nederlandse postcode (4 cijfers + 2 letters)
          </p>
        </div>

        {/* Gender Field */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Hoe identificeer je jezelf? (optioneel)
          </label>
          <div className="flex flex-col gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedGender(option.value)}
                className={`bg-card border-2 ${
                  selectedGender === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                } rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span
                  className={`text-base font-semibold ${
                    selectedGender === option.value
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Consent */}
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
                Ik ga ermee akkoord dat Matti anonieme data verzamelt om de app
                te verbeteren. Mijn naam en exacte gesprekken worden{" "}
                <span className="font-bold">nooit</span> gedeeld.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                We delen alleen algemene trends (zoals thema's en
                leeftijdsgroepen) met gemeentes om jongeren beter te kunnen
                helpen. Je postcode wordt geanonimiseerd.
              </p>
            </div>
          </button>
        </div>

        {/* Submit Button */}
        <div className="mt-8 mb-4">
          <button
            onClick={handleFinish}
            disabled={!isFormValid}
            className={`w-full bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-full ${
              !isFormValid ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            } transition-opacity`}
          >
            Start chatten ✨
          </button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            * = Verplicht veld
          </p>
        </div>

        {/* Extra space at bottom */}
        <div className="h-32" />
      </div>
    </div>
  );
}
