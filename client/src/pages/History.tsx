import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { THEMES, type ThemeId } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { useLocation } from "wouter";
import { MessageSquare, Clock, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import BottomNavigation from "@/components/BottomNavigation";

export default function History() {
  const { setCurrentThemeId } = useMattiTheme();
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: conversations, isLoading } = trpc.chat.getAllConversations.useQuery();

  const handleContinueConversation = (themeId: ThemeId) => {
    setCurrentThemeId(themeId);
    setLocation("/chat");
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
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

    if (!groups[group]) groups[group] = [];
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
        <div className="bg-primary px-6 py-4">
          <h1 className="text-2xl font-bold text-primary-foreground">Geschiedenis</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Nog geen gesprekken</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Start een gesprek met Matti. Je laatste 10 gesprekken worden hier bewaard.
          </p>
          <button
            onClick={() => setLocation("/chat")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
          >
            Start een gesprek
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-primary px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-foreground">Geschiedenis</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Je laatste 10 gesprekken</p>
      </div>

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
                    const isArchived = (convo as any).isArchived;
                    const isExpanded = expandedId === convo.id;
                    const msgs = (convo as any).messages as Array<{ role: string; content: string; timestamp?: string }>;
                    const userMsgCount = (convo as any).userMessageCount ?? 0;

                    return (
                      <div
                        key={convo.id}
                        className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                            >
                              {theme.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{theme.name}</h3>
                                  {isArchived && (
                                    <span style={{
                                      fontSize: "10px",
                                      padding: "1px 7px",
                                      borderRadius: "9999px",
                                      background: "#e0e7ef",
                                      color: "#4b6080",
                                      fontWeight: 600,
                                    }}>
                                      Afgesloten
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true, locale: nl })}
                                  </span>
                                </div>
                              </div>
                              {/* Preview van eerste bericht */}
                              {(convo as any).previewText && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                  "{(convo as any).previewText}{(convo as any).previewText?.length >= 80 ? "…" : ""}"
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MessageSquare className="w-3 h-3" />
                                <span>{userMsgCount} berichten van jou</span>
                              </div>
                            </div>
                          </div>

                          {/* Acties */}
                          <div className="flex gap-2 mt-3">
                            {!isArchived && (
                              <button
                                onClick={() => handleContinueConversation(convo.themeId as ThemeId)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Verder praten
                              </button>
                            )}
                            {msgs && msgs.length > 0 && (
                              <button
                                onClick={() => toggleExpand(convo.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-all"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExpanded ? "Verberg" : "Teruglezen"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Uitklapbare berichten */}
                        {isExpanded && msgs && msgs.length > 0 && (
                          <div className="border-t border-border bg-muted/30 px-4 py-4 space-y-3 max-h-96 overflow-y-auto">
                            {msgs.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                                    msg.role === "user"
                                      ? "bg-primary text-primary-foreground rounded-br-sm"
                                      : "bg-card text-foreground border border-border rounded-bl-sm"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
