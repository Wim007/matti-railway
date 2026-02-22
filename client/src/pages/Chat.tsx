import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { THEMES, type ThemeId, type ChatMessage, type UserProfile } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { detectActionIntelligent } from "@shared/action-detection";
import { generateWelcomeMessage } from "@shared/welcome-message";
import { toast } from "sonner";
import { useRoute } from "wouter";
import BottomNavigation from "@/components/BottomNavigation";

// Helper to get user profile from localStorage
function getUserProfile(): UserProfile | null {
  const profileData = localStorage.getItem("matti_user_profile");
  if (!profileData) return null;
  try {
    return JSON.parse(profileData);
  } catch (e) {
    console.error("Failed to parse profile:", e);
    return null;
  }
}

export default function Chat() {
  const [userProfile] = useState<UserProfile | null>(() => getUserProfile());
  const { currentThemeId, setCurrentThemeId } = useMattiTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if we're opening a specific conversation from history (/chat/:conversationId)
  const [matchById, paramsById] = useRoute("/chat/:conversationId");
  const urlConversationId = matchById && paramsById?.conversationId ? parseInt(paramsById.conversationId, 10) : null;

  // Fetch specific conversation by ID (from history "Verder praten")
  const { data: conversationById, isLoading: loadingById } = trpc.chat.getConversationById.useQuery(
    { conversationId: urlConversationId! },
    { enabled: !!userProfile && !!urlConversationId, refetchOnMount: true, retry: 1, staleTime: 0 }
  );

  // Fetch conversation for current theme (default, only when NOT opening by ID)
  const { data: conversationByTheme, refetch: refetchConversation, isLoading: conversationLoading, isError: conversationError } = trpc.chat.getConversation.useQuery(
    { themeId: currentThemeId },
    { enabled: !!userProfile && !urlConversationId, refetchOnMount: true, retry: 1, staleTime: 0 }
  );

  // Use the specific conversation if coming from history, otherwise use theme conversation
  const conversation = urlConversationId ? conversationById : conversationByTheme;
  const isConversationLoading = urlConversationId ? loadingById : conversationLoading;
  
  // Fetch recent conversation context for follow-up
  const { data: recentContextData } = trpc.followUpContext.getRecentContext.useQuery(
    undefined,
    { enabled: !!userProfile, refetchOnMount: true, retry: 1 }
  );

  // Track previous theme to detect intentional theme changes
  const [previousThemeId, setPreviousThemeId] = useState<ThemeId>(currentThemeId);

  // Refetch conversation ONLY when theme changes intentionally (not from detection)
  useEffect(() => {
    if (userProfile && currentThemeId !== previousThemeId) {
      const isManualThemeChange = !conversation || conversation.themeId !== currentThemeId;
      
      if (isManualThemeChange) {
        setPreviousThemeId(currentThemeId);
        refetchConversation();
        setInitializedConversationId(null);
      }
    }
  }, [currentThemeId, userProfile, refetchConversation, previousThemeId, conversation]);

  // Track if we've initialized messages for this conversation
  const [initializedConversationId, setInitializedConversationId] = useState<number | null>(null);

  // Load messages from conversation
  useEffect(() => {
    if (!conversation || conversation.id === initializedConversationId) {
      return;
    }

    if (conversation?.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      const loadedMessages: ChatMessage[] = (conversation.messages as Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: string;
      }>).map((msg, index) => ({
        id: `${conversation.id}-${index}`,
        content: msg.content,
        isAI: msg.role === "assistant",
        timestamp: msg.timestamp,
      }));
      setMessages(loadedMessages);
      setInitializedConversationId(conversation.id);
    } else if (userProfile && messages.length === 0) {
      const userName = userProfile.name || "daar";
      const welcomeContent = generateWelcomeMessage(userName);
      
      const welcomeMsg: ChatMessage = {
        id: Date.now().toString(),
        content: welcomeContent,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      setInitializedConversationId(conversation.id);
    }
  }, [conversation, userProfile, initializedConversationId, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Prefilled bericht vanuit welkomstpagina (na account-aanmaak of direct inloggen)
  useEffect(() => {
    const prefilled = sessionStorage.getItem("matti_prefilled_message");
    if (prefilled && conversation && messages.length <= 1) {
      sessionStorage.removeItem("matti_prefilled_message");
      setInputText(prefilled);
    }
  }, [conversation, messages.length]);

  // Mutations
  const sendToAssistant = trpc.assistant.send.useMutation();
  const saveMessage = trpc.chat.saveMessage.useMutation();
  const summarize = trpc.assistant.summarize.useMutation();
  const updateSummary = trpc.chat.updateSummary.useMutation();
  const saveAction = trpc.action.saveAction.useMutation();
  const deleteConversation = trpc.chat.deleteConversation.useMutation();
  const closeAndStartNew = trpc.chat.closeAndStartNew.useMutation();
  
  // Analytics tracking
  const trackSessionStart = trpc.analytics.trackSessionStart.useMutation();
  const trackMessageSent = trpc.analytics.trackMessageSent.useMutation();
  const trackSessionEnd = trpc.analytics.trackSessionEnd.useMutation();
  const trackRiskDetected = trpc.analytics.trackRiskDetected.useMutation();
  
  // Intervention tracking
  const scheduleBullyingFollowUp = trpc.chat.scheduleBullyingFollowUp.useMutation();
  const initializeIntervention = trpc.chat.initializeIntervention.useMutation();
  
  // Feedback
  const submitFeedback = trpc.feedback.submitFeedback.useMutation();
  
  // Track session start when conversation is loaded
  const [sessionStartTracked, setSessionStartTracked] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [feedbackState, setFeedbackState] = useState<Record<string, { rating: 'up' | 'down' | null; showInput: boolean; text: string }>>({})

  // --- 30-minuten inactiviteits-reset ---
  const INACTIVITY_MS = 30 * 60 * 1000;
  const lastActivityRef = useRef<number>(Date.now());

  const updateLastActivity = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem("matti_last_activity", now.toString());
  };

  // Check bij mount of gebruiker langer dan 30 min weg was
  useEffect(() => {
    const stored = localStorage.getItem("matti_last_activity");
    const now = Date.now();
    if (stored) {
      const elapsed = now - parseInt(stored, 10);
      if (elapsed >= INACTIVITY_MS) {
        // Genereer samenvatting van het vorige gesprek en archiveer het
        const doClose = async () => {
          try {
            await closeAndStartNew.mutateAsync({ themeId: currentThemeId });
          } catch (e) {
            console.warn('[Inactivity] closeAndStartNew failed, proceeding anyway', e);
          } finally {
            setMessages([]);
            setInitializedConversationId(null);
            setSessionStartTracked(false);
            refetchConversation();
          }
        };
        doClose();
      }
    }
    updateLastActivity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (conversation && !sessionStartTracked && userProfile) {
      const isNewConversation = !conversation.messages || conversation.messages.length === 0;
      
      trackSessionStart.mutate({
        conversationId: conversation.id,
        themeId: currentThemeId,
        isNewUser: isNewConversation,
      });
      
      setSessionStartTracked(true);
      setSessionStartTime(Date.now());
    }
  }, [conversation, sessionStartTracked, userProfile, currentThemeId]);

  const handleFeedbackClick = async (
    messageId: string,
    messageIndex: number,
    rating: "up" | "down"
  ) => {
    if (!conversation) return;

    if (rating === "up") {
      try {
        await submitFeedback.mutateAsync({
          conversationId: conversation.id,
          messageIndex,
          rating: "up",
        });
        setFeedbackState((prev) => ({
          ...prev,
          [messageId]: { rating: "up", showInput: false, text: "" },
        }));
        toast.success("Bedankt voor je feedback!");
      } catch (error) {
        console.error("Failed to submit thumbs up feedback:", error);
        toast.error("Kon feedback niet opslaan. Probeer het opnieuw.");
      }
      return;
    }

    setFeedbackState((prev) => ({
      ...prev,
      [messageId]: {
        rating: "down",
        showInput: true,
        text: prev[messageId]?.text || "",
      },
    }));
  };

  const handleSubmitNegativeFeedback = async (
    messageId: string,
    messageIndex: number
  ) => {
    if (!conversation) return;
    const current = feedbackState[messageId];
    if (!current) return;

    try {
      await submitFeedback.mutateAsync({
        conversationId: conversation.id,
        messageIndex,
        rating: "down",
        feedbackText: current.text.trim() || undefined,
      });
      setFeedbackState((prev) => ({
        ...prev,
        [messageId]: { rating: "down", showInput: false, text: "" },
      }));
      toast.success("Dank je, je feedback is opgeslagen.");
    } catch (error) {
      console.error("Failed to submit thumbs down feedback:", error);
      toast.error("Kon feedback niet opslaan. Probeer het opnieuw.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userProfile) return;
    updateLastActivity();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isAI: false,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const messageText = inputText.trim();
    setInputText("");
    setIsTyping(true);

    try {
      if (!conversation) {
        throw new Error("No active conversation");
      }
      await saveMessage.mutateAsync({
        conversationId: conversation.id,
        role: "user",
        content: messageText,
      });
      
      const currentMessageCount = messages.length + 1;
      if (conversation) {
        trackMessageSent.mutate({
          conversationId: conversation.id,
          themeId: currentThemeId,
          messageCount: currentMessageCount,
        });
      }

      let context = "";

      // Bepaal of dit een nieuwe sessie is (eerste echte gebruikersbericht)
      const isFirstMessage = messages.filter((m) => !m.isAI).length === 0;

      if (isFirstMessage && conversation?.summary) {
        // Nieuwe sessie: stuur ALLEEN de samenvatting als context (kostenbeheersing)
        context = `[SESSIESAMENVATTING VORIG GESPREK]\n${conversation.summary}`;
        console.log('[Context] New session: using summary only (no full history)');
      } else if (conversation?.summary) {
        // Lopend gesprek: samenvatting + laatste 5 berichten
        const recentMessages = messages.slice(-5);
        context = `[SESSIESAMENVATTING]\n${conversation.summary}\n\n[RECENTE BERICHTEN]\n`;
        context += recentMessages
          .map((m) => `${m.isAI ? "Matti" : "Gebruiker"}: ${m.content}`)
          .join("\n");
        console.log('[Context] Ongoing session: summary + last 5 messages');
      } else {
        // Geen samenvatting: stuur laatste 5 berichten
        const recentMessages = messages.slice(-5);
        context += recentMessages
          .map((m) => `${m.isAI ? "Matti" : "Gebruiker"}: ${m.content}`)
          .join("\n");
        console.log('[Context] No summary: last 5 messages only');
      }

      let followUpContext: string | undefined = undefined;
      if (messages.length === 1 && recentContextData?.contextPrompt) {
        followUpContext = recentContextData.contextPrompt;
        console.log('[Chat] Adding follow-up context to first message');
      }

      const { detectCrisis, getCrisisResponseGuidance } = await import("@shared/crisis-detection");
      const crisisDetection = detectCrisis(messageText);
      
      let crisisGuidance = "";
      if (crisisDetection.detected && crisisDetection.requiresImmediateAction) {
        crisisGuidance = getCrisisResponseGuidance(crisisDetection);
        console.log(`[Crisis] Detected ${crisisDetection.type} (${crisisDetection.severity}) - Keywords: ${crisisDetection.matchedKeywords.join(", ")}`);
      }

      const response = await sendToAssistant.mutateAsync({
        message: messageText,
        context,
        themeId: currentThemeId,
        userProfile: userProfile.age && userProfile.gender
          ? {
              name: userProfile.name || "",
              age: userProfile.age,
              gender: userProfile.gender,
            }
          : undefined,
        followUpContext,
        crisisGuidance: crisisGuidance || undefined,
      });

      if (response.riskDetected && response.riskLevel && response.riskType && conversation) {
        trackRiskDetected.mutate({
          conversationId: conversation.id,
          riskLevel: response.riskLevel,
          riskType: response.riskType,
          actionTaken: "Crisisprotocol toegepast in AI response",
          detectedText: messageText,
        });
      }

      if (
        userProfile?.themeSuggestionsEnabled !== false &&
        response.detectedTheme &&
        response.detectedTheme !== currentThemeId
      ) {
        const suggestedTheme = THEMES.find((theme) => theme.id === response.detectedTheme);
        if (suggestedTheme) {
          toast("Thema suggestie", {
            description: `Dit lijkt beter te passen bij ${suggestedTheme.emoji} ${suggestedTheme.name}.`,
            action: {
              label: "Wissel",
              onClick: () => setCurrentThemeId(response.detectedTheme as ThemeId),
            },
          });
        }
      }

      const detectedAction = detectActionIntelligent(response.reply);
      const assistantReply = detectedAction?.cleanResponse ?? response.reply;

      if (!conversation) {
        throw new Error("No active conversation");
      }
      await saveMessage.mutateAsync({
        conversationId: conversation.id,
        role: "assistant",
        content: assistantReply,
        threadId: conversation.threadId || undefined,
      });
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        content: assistantReply,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (detectedAction) {
        console.log(`[Action Detection] Detected action: ${detectedAction.actionText}`);
        
        await saveAction.mutateAsync({
          themeId: currentThemeId,
          conversationId: conversation.id,
          actionText: detectedAction.actionText,
        });

        toast.success("Actie gedetecteerd!", {
          description: `${detectedAction.actionText} is toegevoegd aan je actielijst.`,
        });
      }

      if (conversation.messages && conversation.messages.length > 0 && conversation.messages.length % 10 === 0) {
        console.log(`[Summarization] Triggering summarization after ${conversation.messages.length} messages`);
        
        const allMessages = [...(conversation.messages as Array<{ role: string; content: string }>), 
          { role: "user", content: messageText },
          { role: "assistant", content: assistantReply }
        ];
        
        const summaryPrompt = [
          "Vat dit gesprek kort samen in het Nederlands.",
          "",
          "Bestaande samenvatting:",
          conversation.summary || "Geen",
          "",
          "Nieuwe berichten:",
          allMessages.map(m => `${m.role === "user" ? "Gebruiker" : "Matti"}: ${m.content}`).join("\n"),
        ].join("\n");
        
        const summaryResult = await summarize.mutateAsync({
          prompt: summaryPrompt,
        });

        await updateSummary.mutateAsync({
          themeId: currentThemeId,
          summary: summaryResult.summary,
        });

        console.log("[Summarization] Summary updated successfully");
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Er ging iets mis bij het versturen van je bericht. Probeer het opnieuw.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  // Show loading state
  if (isConversationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Gesprek laden...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (conversationError && !urlConversationId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Kon gesprek niet laden</p>
          <button 
            onClick={() => refetchConversation()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}>
            <div className="max-w-[80%]">
              <div className={`rounded-lg p-3 ${
                msg.isAI 
                  ? "bg-secondary text-secondary-foreground" 
                  : "bg-primary text-primary-foreground"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.isAI && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFeedbackClick(msg.id, index, "up")}
                      disabled={submitFeedback.isPending}
                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                        feedbackState[msg.id]?.rating === "up"
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedbackClick(msg.id, index, "down")}
                      disabled={submitFeedback.isPending}
                      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                        feedbackState[msg.id]?.rating === "down"
                          ? "bg-red-100 border-red-300 text-red-700"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      👎
                    </button>
                  </div>

                  {feedbackState[msg.id]?.showInput && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={feedbackState[msg.id]?.text || ""}
                        onChange={(e) =>
                          setFeedbackState((prev) => ({
                            ...prev,
                            [msg.id]: {
                              rating: "down",
                              showInput: true,
                              text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Wat ging er niet goed?"
                        className="w-full min-h-20 px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSubmitNegativeFeedback(msg.id, index)}
                          disabled={submitFeedback.isPending}
                          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                        >
                          Verstuur feedback
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFeedbackState((prev) => ({
                              ...prev,
                              [msg.id]: {
                                rating: prev[msg.id]?.rating || null,
                                showInput: false,
                                text: prev[msg.id]?.text || "",
                              },
                            }))
                          }
                          className="px-3 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:bg-muted"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type je bericht..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            Verstuur
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
