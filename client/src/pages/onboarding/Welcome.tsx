import { useEffect } from "react";
import { useLocation } from "wouter";
import mattiAvatar from "@/assets/matti-avatar.png";

const EXAMPLE_OPTIONS = [
  "Ik voel me niet goed",
  "Ik maak me zorgen",
  "Ik heb ruzie gehad",
  "Gewoon even praten",
];

export default function Welcome() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const profile = localStorage.getItem("matti_user_profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        if (parsed?.name) {
          setLocation("/chat");
        }
      } catch (e) {
        // corrupt data, toon welkomstpagina
      }
    }
  }, [setLocation]);

  const handleStart = (prefilledMessage?: string) => {
    if (prefilledMessage) {
      sessionStorage.setItem("matti_prefilled_message", prefilledMessage);
    }
    setLocation("/onboarding/account");
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>

        {/* Avatar */}
        <img
          src={mattiAvatar}
          alt="Matti"
          style={{ width: "120px", height: "120px", objectFit: "contain" }}
        />

        {/* Titel + subtekst */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2563eb", margin: 0 }}>
            Hoi, ik ben Matti.
          </h1>
          <p style={{ fontSize: "1rem", color: "#64748b", marginTop: "8px" }}>
            Je kunt hier praten over wat er in je hoofd zit.
          </p>
        </div>

        {/* Voorbeeldopties */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
          {EXAMPLE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => handleStart(option)}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "14px",
                border: "1.5px solid #bfdbfe",
                background: "#ffffff",
                color: "#1e40af",
                fontSize: "0.95rem",
                fontWeight: 600,
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
                boxShadow: "0 1px 4px rgba(37,99,235,0.07)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#eff6ff";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#93c5fd";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#bfdbfe";
              }}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Primaire knop */}
        <button
          onClick={() => handleStart()}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(90deg, #2563eb, #7c3aed)",
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
          }}
        >
          Laten we praten
        </button>

        {/* Over Matti link */}
        <button
          onClick={() => setLocation("/parent-info")}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.85rem",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "4px",
          }}
        >
          Over Matti
        </button>

      </div>
    </div>
  );
}
