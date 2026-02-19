import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { THEMES, type ThemeId, type ChatMessage } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { detectActionIntelligent } from "@shared/action-detection";
import { generateWelcomeMessage } from "@shared/welcome-message";
import { toast } from "sonner";

// Helper to get user profile from localStorage
function getUserProfile() {
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
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const { currentThemeId, setCurrentThemeId } = useMattiTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find((t) => t.id === currentThemeId)!;

  // Fetch conversation for current theme
  const { data: conversation, refetch: refetchConversation, isLoading: conversationLoading, isError: conversationError } = trpc.chat.getConversation.useQuery(
    { themeId: currentThemeId },
    { enabled: !!userProfile, refetchOnMount: true, retry: 1, staleTime: 0 }
  );
  
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

  // Mutations
  const sendToAssistant = trpc.assistant.send.useMutation();
  const saveMessage = trpc.chat.saveMessage.useMutation();
  const summarize = trpc.assistant.summarize.useMutation();
  const updateSummary = trpc.chat.updateSummary.useMutation();
  const saveAction = trpc.action.saveAction.useMutation();
  const deleteConversation = trpc.chat.deleteConversation.useMutation();
  
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
  const [feedbackState, setFeedbackState] = useState<Record<string, { rating: 'up' | 'down' | null; showInput: boolean; text: string }>>({});
  
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !userProfile) return;

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
      
      if (conversation?.summary) {
        context = `[EERDERE SAMENVATTING]\n${conversation.summary}\n\n[RECENTE BERICHTEN]\n`;
      }
      
      const recentMessages = messages.slice(-8);
      context += recentMessages
        .map((m) => `${m.isAI ? "Matti" : "Gebruiker"}: ${m.content}`)
        .join("\n");

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
        userProfile: userProfile.age && userProfile.gender && userProfile.gender !== "none"
          ? {
              name: userProfile.name || "",
              age: userProfile.age,
              gender: userProfile.gender,
            }
          : undefined,
        followUpContext,
        crisisGuidance: crisisGuidance || undefined,
      });

      if (!conversation) {
        throw new Error("No active conversation");
      }
      await saveMessage.mutateAsync({
        conversationId: conversation.id,
        role: "assistant",
        content: response.reply,
        threadId: conversation.threadId || undefined,
      });
      
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        content: response.reply,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      const detectedAction = detectActionIntelligent(messageText, response.reply);
      if (detectedAction) {
        console.log(`[Action Detection] Detected action: ${detectedAction.type}`);
        
        await saveAction.mutateAsync({
          conversationId: conversation.id,
          actionType: detectedAction.type,
          description: detectedAction.description,
          status: "pending",
          priority: detectedAction.priority,
        });

        toast.success("Actie gedetecteerd!", {
          description: `${detectedAction.description} is toegevoegd aan je actielijst.`,
        });
      }

      if (conversation.messages && conversation.messages.length > 0 && conversation.messages.length % 10 === 0) {
        console.log(`[Summarization] Triggering summarization after ${conversation.messages.length} messages`);
        
        const allMessages = [...(conversation.messages as Array<{ role: string; content: string }>), 
          { role: "user", content: messageText },
          { role: "assistant", content: response.reply }
        ];
        
        const summaryResult = await summarize.mutateAsync({
          messages: allMessages.map(m => `${m.role === "user" ? "Gebruiker" : "Matti"}: ${m.content}`).join("\n"),
          existingSummary: conversation.summary || undefined,
        });

        await updateSummary.mutateAsync({
          conversationId: conversation.id,
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
  if (conversationLoading) {
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
  if (conversationError) {
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
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isAI ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.isAI 
                ? "bg-secondary text-secondary-foreground" 
                : "bg-primary text-primary-foreground"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
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
    </div>
  );
}
