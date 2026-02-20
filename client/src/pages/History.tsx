import { trpc } from "@/lib/trpc";
import { THEMES, type ThemeId } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { useLocation } from "wouter";
import { MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export default function History() {
  const { setCurrentThemeId } = useMattiTheme();
  const [, setLocation] = useLocation();

  const { data: conversations, isLoading } = trpc.chat.getAllConversations.useQuery();

  const handleResumeConversation = (themeId: ThemeId) => {
    setCurrentThemeId(themeId);
    setLocation("/chat");
  };

  // Group conversations by date
  const groupedConversations = conversations?.reduce((groups, convo) => {
    const date = new Date(convo.updatedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let group: string;
    if (diffDays === 0) {
      group = "Vandaag";
    } else if (diffDays < 7) {
      group = "Deze week";
    } else if (diffDays < 30) {
      group = "Deze maand";
    } else {
      group = "Ouder";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(convo);
    return groups;
  }, {} as Record<string, typeof conversations>);

  const groupOrder = ["Vandaag", "Deze week", "Deze maand", "Ouder"];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <h1 className="text-2xl font-bold text-primary-foreground">Geschiedenis</h1>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Nog geen gesprekken
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Start een gesprek met Matti over een thema dat je bezighoudt. Je gesprekken worden hier bewaard.
          </p>
          <button
            onClick={() => setLocation("/chat")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
          >
            Start een gesprek
          </button>
        </div>

        {/* Bottom Tab Navigation */}
        <TabNavigation currentTab="history" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-foreground">Geschiedenis</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto bg-background">
        <div className="space-y-8 max-w-2xl mx-auto">
          {groupOrder.map((groupName) => {
            const groupConvos = groupedConversations?.[groupName];
            if (!groupConvos || groupConvos.length === 0) return null;

            return (
              <div key={groupName}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
                  {groupName}
                </h2>
                <div className="space-y-3">
                  {groupConvos.map((convo) => {
                    const theme = THEMES.find((t) => t.id === convo.themeId);
                    if (!theme) return null;

                    const [gradientFrom, gradientTo] = theme.colors.gradient;

                    return (
                      <button
                        key={convo.id}
                        onClick={() => handleResumeConversation(convo.themeId)}
                        className="w-full bg-card rounded-xl p-4 shadow-sm hover:shadow-md hover:bg-muted transition-all border border-border text-left group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Theme Icon */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                            }}
                          >
                            {theme.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {theme.name}
                              </h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(convo.updatedAt), {
                                    addSuffix: true,
                                    locale: nl,
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Summary Preview */}
                            {convo.summary ? (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {convo.summary}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic mb-2">
                                Nog geen samenvatting
                              </p>
                            )}

                            {/* Message Count */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MessageSquare className="w-3 h-3" />
                              <span>{convo.messageCount} berichten</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <TabNavigation currentTab="history" />
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
