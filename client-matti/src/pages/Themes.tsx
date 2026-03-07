import { THEMES } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { useLocation } from "wouter";

export default function Themes() {
  const { setCurrentThemeId } = useMattiTheme();
  const [, setLocation] = useLocation();

  const handleThemeClick = (themeId: string) => {
    setCurrentThemeId(themeId as any);
    setLocation("/chat");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-foreground">Thema's</h1>
        <p className="text-sm text-primary-foreground/85 mt-1">
          Kies een thema om over te praten
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-background">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeClick(theme.id)}
              className="block p-5 rounded-2xl border-2 border-border bg-card hover:border-primary transition-colors"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.gradient[0]}15 0%, ${theme.colors.gradient[1]}15 100%)`,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{theme.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <TabNavigation currentTab="themes" />
    </div>
  );
}

function TabNavigation({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: "chat", label: "Chat", icon: "💬", path: "/chat" },
    { id: "history", label: "Geschiedenis", icon: "📜", path: "/history" },
    { id: "themes", label: "Thema's", icon: "🎨", path: "/themes" },
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
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              currentTab === tab.id ? "text-foreground opacity-100" : "text-muted-foreground opacity-80 hover:opacity-100"
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">
              {tab.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
