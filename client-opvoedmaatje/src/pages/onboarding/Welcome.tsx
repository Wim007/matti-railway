import { useEffect } from "react";
import { useLocation } from "wouter";
import mattiAvatar from "@/assets/opvoedmaatje-logo-new.png";

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

  const handleStart = () => {
    // Als gebruiker al een profiel heeft: direct naar chat
    const profile = localStorage.getItem("matti_user_profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        if (parsed?.name) {
          setLocation("/chat");
          return;
        }
      } catch (e) {
        // corrupt, ga naar account
      }
    }
    // Niet ingelogd: naar account-aanmaak
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

        {/* Logo */}
        <img
          src={mattiAvatar}
          alt="Opvoedmaatje"
          style={{ width: "300px", height: "300px", objectFit: "contain" }}
        />

        {/* Titel + subtekst */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2563eb", margin: 0 }}>
            Hoi, ik ben Opvoedmaatje.
          </h1>
          <p style={{ fontSize: "1rem", color: "#64748b", marginTop: "12px", lineHeight: "1.6" }}>
            Fijn dat je hier bent.<br />
            Opvoeden is soms prachtig en soms ingewikkeld.<br />
            Je hoeft het niet alleen te doen.
          </p>
        </div>

        {/* Primaire knop */}
        <button
          onClick={handleStart}
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
          Maak een account aan
        </button>

        {/* Over Opvoedmaatje link */}
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
          Over Opvoedmaatje
        </button>

      </div>
    </div>
  );
}
