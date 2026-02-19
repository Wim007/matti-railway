import { useState, useEffect } from "react";
import type { UserProfile } from "@shared/matti-types";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("matti_user_profile");
    if (stored) {
      setProfile(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    if (confirm("Weet je zeker dat je wilt uitloggen?")) {
      localStorage.removeItem("matti_user_profile");
      window.location.href = "/";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4" style={{background: 'linear-gradient(90deg, #c7b8ff 0%, #aaf2f3 100%)'}}>
        <h1 className="text-2xl font-bold text-white">Profiel</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto" style={{backgroundColor: '#f5f9ff'}}>
        {profile ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* User Info Card */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Jouw gegevens
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Naam</p>
                  <p className="text-base font-semibold text-foreground">
                    {profile.name}
                  </p>
                </div>
                {profile.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <p className="text-base font-semibold text-foreground">
                      {profile.email}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Leeftijd</p>
                  <p className="text-base font-semibold text-foreground">
                    {profile.age} jaar
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Postcode</p>
                  <p className="text-base font-semibold text-foreground">
                    {profile.postalCode}
                  </p>
                </div>
                {profile.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Geslacht</p>
                    <p className="text-base font-semibold text-foreground">
                      {profile.gender === "boy"
                        ? "Jongen"
                        : profile.gender === "girl"
                        ? "Meisje"
                        : profile.gender === "other"
                        ? "Anders"
                        : "Zeg ik liever niet"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Instellingen
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      Analytics toestemming
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Anonieme data delen voor onderzoek
                    </p>
                  </div>
                  <span className="text-lg">
                    {profile.analyticsConsent ? "✅" : "❌"}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback Dashboard Button (for owner) */}
            <button
              onClick={() => window.location.href = '/feedback-dashboard'}
              className="w-full bg-[#150745] text-white font-bold text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity mb-4"
            >
              📊 Feedback Dashboard
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-destructive text-white font-bold text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
            >
              Uitloggen
            </button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg mb-2">👤</p>
            <p>Geen profiel gevonden</p>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <TabNavigation currentTab="profile" />
    </div>
  );
}

function TabNavigation({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: "chat", label: "Chat", icon: "💬", path: "/chat" },
    { id: "history", label: "Geschiedenis", icon: "📜", path: "/history" },

    { id: "profile", label: "Profiel", icon: "👤", path: "/profile" },
    { id: "actions", label: "Acties", icon: "💪", path: "/actions" },
  ];

  return (
    <div className="border-t border-border bg-background">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.path}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-opacity ${
              currentTab === tab.id ? "opacity-100" : "opacity-50 hover:opacity-75"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium text-foreground">
              {tab.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
