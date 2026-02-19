import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { THEMES, type ThemeId, type ChatMessage } from "@shared/matti-types";
import { useMattiTheme } from "@/contexts/MattiThemeContext";
import { detectActionIntelligent } from "@shared/action-detection";
import { generateWelcomeMessage } from "@shared/welcome-message";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const { currentThemeId, setCurrentThemeId } = useMattiTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES.find((t) => t.id === currentThemeId)!;

  // Fetch conversation for current theme
  const { data: conversation, refetch: refetchConversation, isLoading: conversationLoading, isError: conversationError } = trpc.chat.getConversation.useQuery(
    { themeId: currentThemeId },
    { enabled: !!user, refetchOnMount: true, retry: 1, staleTime: 0 }
  );
  
  // Fetch recent conversation context for follow-up
  const { data: recentContextData } = trpc.followUpContext.getRecentContext.useQuery(
    undefined,
    { enabled: !!user, refetchOnMount: true, retry: 1 }
  );

  // Track previous theme to detect intentional theme changes
  const [previousThemeId, setPreviousThemeId] = useState<ThemeId>(currentThemeId);

  // Refetch conversation ONLY when theme changes intentionally (not from detection)
  useEffect(() => {
    if (user && currentThemeId !== previousThemeId) {
      // Only refetch if this is a manual theme change (via Themes page or navigation)
      // NOT from automatic theme detection during conversation
      const isManualThemeChange = !conversation || conversation.themeId !== currentThemeId;
      
      if (isManualThemeChange) {
        setPreviousThemeId(currentThemeId);
        refetchConversation();
        setInitializedConversationId(null); // Reset to load new conversation
      }
    }
  }, [currentThemeId, user, refetchConversation, previousThemeId, conversation]);

  // Track if we've initialized messages for this conversation
  const [initializedConversationId, setInitializedConversationId] = useState<number | null>(null);

  // Load messages from conversation
  useEffect(() => {
    // Only update messages if conversation ID changed or this is first load
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
    } else if (user && messages.length === 0) {
      // Show welcome message ONLY if no messages exist yet (first time)
      // Get name and age from localStorage profile (onboarding)
      const profileData = localStorage.getItem("matti_user_profile");
      let userName = "daar";
      let userAge = 16; // default
      if (profileData) {
        try {
          const profile = JSON.parse(profileData);
          userName = profile.name || "daar";
          userAge = profile.age || 16;
        } catch (e) {
          console.error("Failed to parse profile:", e);
        }
      }

      // Check if there's recent context for follow-up
      const welcomeContent = generateWelcomeMessage(userName);
      
      // If there's recent context, generate AI follow-up instead of generic welcome
      if (recentContextData?.context) {
        const { context } = recentContextData;
        console.log('[Chat] Recent context detected for follow-up:', context);
        
        // Generate follow-up message via AI
        // This will be handled in the first user message, not here
        // For now, show generic welcome and let AI handle follow-up naturally
      }

      const welcomeMsg: ChatMessage = {
        id: Date.now().toString(),
        content: welcomeContent,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      setInitializedConversationId(conversation.id);
    }
  }, [conversation, user, initializedConversationId, messages.length]);

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
    if (conversation && !sessionStartTracked && user) {
      // Check if this is a new conversation (no messages yet)
      const isNewConversation = !conversation.messages || conversation.messages.length === 0;
      
      trackSessionStart.mutate({
        conversationId: conversation.id,
        themeId: currentThemeId,
        isNewUser: isNewConversation,
      });
      
      setSessionStartTracked(true);
      setSessionStartTime(Date.now());
    }
  }, [conversation, sessionStartTracked, user, currentThemeId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

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
      // Save user message to database
      if (!conversation) {
        throw new Error("No active conversation");
      }
      await saveMessage.mutateAsync({
        conversationId: conversation.id,
        role: "user",
        content: messageText,
      });
      
      // Track MESSAGE_SENT event
      const currentMessageCount = messages.length + 1; // +1 for the message just sent
      if (conversation) {
        trackMessageSent.mutate({
          conversationId: conversation.id,
          themeId: currentThemeId,
          messageCount: currentMessageCount,
        });
      }

      // Build context from summary + recent messages
      let context = "";
      
      if (conversation?.summary) {
        context = `[EERDERE SAMENVATTING]\n${conversation.summary}\n\n[RECENTE BERICHTEN]\n`;
      }
      
      const recentMessages = messages.slice(-8);
      context += recentMessages
        .map((m) => `${m.isAI ? "Matti" : "Gebruiker"}: ${m.content}`)
        .join("\n");

      // Add follow-up context if this is first message in new session
      let followUpContext: string | undefined = undefined;
      if (messages.length === 1 && recentContextData?.contextPrompt) {
        // First user message after welcome - include follow-up context
        followUpContext = recentContextData.contextPrompt;
        console.log('[Chat] Adding follow-up context to first message');
      }

      // Detect crisis in user message BEFORE sending to AI
      const { detectCrisis, getCrisisResponseGuidance } = await import("@shared/crisis-detection");
      const crisisDetection = detectCrisis(messageText);
      
      // If crisis detected, add guidance to AI context
      let crisisGuidance = "";
      if (crisisDetection.detected && crisisDetection.requiresImmediateAction) {
        crisisGuidance = getCrisisResponseGuidance(crisisDetection);
        console.log(`[Crisis] Detected ${crisisDetection.type} (${crisisDetection.severity}) - Keywords: ${crisisDetection.matchedKeywords.join(", ")}`);
      }

      // Send to OpenAI Assistant (with crisis guidance if detected)
      const response = await sendToAssistant.mutateAsync({
        message: messageText,
        context,
        themeId: currentThemeId,
        userProfile: user.age && user.gender && user.gender !== "none"
          ? {
              name: user.name || "",
              age: user.age,
              gender: user.gender,
            }
          : undefined,
        followUpContext,
        crisisGuidance: crisisGuidance || undefined, // Pass crisis protocol to AI
      });

      // Save assistant response
      if (!conversation) {
        throw new Error("No active conversation");
      }
      await saveMessage.mutateAsync({
        conversationId: conversation.id,
        role: "assistant",
        content: response.reply,
        threadId: conversation.threadId || undefined,
      });
      
      // DISABLED: Automatic theme switching during conversations causes message loss
      // Theme detection is now only used for intervention tracking, not for switching conversations
      // Users can manually switch themes via "Nieuw Gesprek" button
      /*
      if (response.detectedTheme && response.detectedTheme !== "general" && response.detectedTheme !== currentThemeId) {
        console.log(`[ThemeDetection] Detected theme ${response.detectedTheme}, but keeping current conversation stable`);
        const newTheme = THEMES.find(t => t.id === response.detectedTheme);
        if (newTheme) {
          toast.info(`${newTheme.emoji} Onderwerp gedetecteerd: "${newTheme.name}"`, {
            description: "Gesprek blijft in huidig thema",
          });
        }
      }
      */
      
      // Track RISK_DETECTED if crisis was detected in user message
      if (crisisDetection.detected && crisisDetection.requiresImmediateAction && conversation) {
        trackRiskDetected.mutate({
          conversationId: conversation.id,
          riskLevel: crisisDetection.severity as any,
          riskType: crisisDetection.type as any,
          actionTaken: `Crisis protocol activated: ${crisisDetection.recommendedReferral}`,
          detectedText: messageText.substring(0, 200),
        });
        console.log(`[Analytics] CRISIS_DETECTED: ${crisisDetection.type} (${crisisDetection.severity}) - Referral: ${crisisDetection.recommendedReferral}`);
      }
      
      // Also track if AI detected additional risk in response
      if (response.riskDetected && response.riskLevel && response.riskType && conversation) {
        trackRiskDetected.mutate({
          conversationId: conversation.id,
          riskLevel: response.riskLevel,
          riskType: response.riskType,
          actionTaken: "Crisis resources provided in chat response",
          detectedText: response.reply.substring(0, 200),
        });
        console.log(`[Analytics] AI_RISK_DETECTED: ${response.riskLevel} - ${response.riskType}`);
      }

      // Detect action in AI response (intelligent post-processing)
      const actionDetection = detectActionIntelligent(response.reply);
      
      // Add assistant response to UI (with clean response if action detected)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: actionDetection ? actionDetection.cleanResponse : response.reply,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Detect theme and schedule follow-up if intervention is needed
      if (conversation) {
        const { detectTheme, getInterventionApproach } = await import("@shared/theme-detection-comprehensive");
        const allMessages = [...messages, userMsg, aiMsg].map(m => ({
          role: m.isAI ? "assistant" : "user",
          content: m.content,
        }));
        
        // Detect theme from latest user message
        const themeDetection = detectTheme(messageText);
        
        if (themeDetection.requiresIntervention && !conversation.bullyingFollowUpScheduled) {
          const approach = getInterventionApproach(themeDetection.theme, themeDetection.severity);
          console.log(`[ThemeDetection] Intervention required for ${themeDetection.theme} with severity: ${themeDetection.severity}`);
          
          try {
            // Initialize intervention if not already started
            if (!conversation.initialProblem) {
              await initializeIntervention.mutateAsync({
                conversationId: conversation.id,
                initialProblem: `${THEMES.find(t => t.id === themeDetection.theme)?.name || themeDetection.theme} - ${themeDetection.keywords.slice(0, 3).join(", ")}`,
              });
            }
            
            // Schedule follow-up based on theme approach (map critical to high for API)
            await scheduleBullyingFollowUp.mutateAsync({
              conversationId: conversation.id,
              severity: themeDetection.severity === "critical" ? "high" : themeDetection.severity as "low" | "medium" | "high",
            });
            
            const themeName = THEMES.find(t => t.id === themeDetection.theme)?.name || "dit onderwerp";
            toast.info(`💙 We checken over ${approach.followUpDays} dagen hoe het met je gaat`, {
              description: `Matti houdt ${themeName} in de gaten`,
            });
          } catch (error) {
            console.error('[ThemeDetection] Failed to schedule follow-up:', error);
          }
        }
      }
      
      // Save action if detected (non-blocking - don't await)
      if (actionDetection) {
        // Run action tracking in background without blocking chat
        saveAction.mutateAsync({
          themeId: currentThemeId,
          actionText: actionDetection.actionText,
          conversationId: conversation?.id,
        }).then((actionResult) => {
          console.log('[ActionTracking] Action saved:', actionDetection.actionText);
          
          // Show toast notification
          toast.success("💪 Actie opgeslagen!", {
            description: actionDetection.actionText,
            action: {
              label: "Bekijk",
              onClick: () => window.location.href = "/actions",
            },
          });
        }).catch((error) => {
          console.error('[ActionTracking] Failed to save action:', error);
          // Silently fail - don't block user experience
        });
      }

      // Refresh conversation
      await refetchConversation();

      // Check if we need to summarize (every 10 messages)
      const totalMessages = messages.length + 2; // +2 for user + AI messages just added
      if (totalMessages > 0 && totalMessages % 10 === 0) {
        console.log('[Summarization] Threshold reached, generating summary...');
        
        // Build prompt for summarization
        const allMessages = [...messages, userMsg, aiMsg];
        const conversationText = allMessages
          .map((m) => `${m.isAI ? "Matti" : "Gebruiker"}: ${m.content}`)
          .join("\n");
        
        const summaryPrompt = `Vat het volgende gesprek samen in maximaal 3 zinnen. Focus op de belangrijkste punten en gevoelens:\n\n${conversationText}`;
        
        try {
          const summaryResult = await summarize.mutateAsync({
            prompt: summaryPrompt,
          });
          
          if (summaryResult.summary) {
            await updateSummary.mutateAsync({
              themeId: currentThemeId,
              summary: summaryResult.summary,
            });
            console.log('[Summarization] Summary saved:', summaryResult.summary);
          }
        } catch (error) {
          console.error('[Summarization] Failed:', error);
          // Don't block user flow if summarization fails
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, er ging iets mis. Probeer het nog eens! 🔄",
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;

    try {
      // Track SESSION_END before starting new chat
      if (conversation && sessionStartTracked) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        trackSessionEnd.mutate({
          conversationId: conversation.id,
          durationSeconds,
          totalMessages: messages.length,
        });
      }
      
      // Reset theme to general BEFORE deleting conversation
      setCurrentThemeId('general');
      
      // Delete existing conversation (including conversationId)
      await deleteConversation.mutateAsync({ themeId: currentThemeId });
      
      // Reset session tracking for new conversation
      setSessionStartTracked(false);
      
      // Reset conversation initialization tracker
      setInitializedConversationId(null);
      
      // Refetch to create new empty conversation
      await refetchConversation();
      
      // Show fresh welcome message
      // Get name from localStorage profile
      const profileData = localStorage.getItem("matti_user_profile");
      let userName = "daar";
      if (profileData) {
        try {
          const profile = JSON.parse(profileData);
          userName = profile.name || "daar";
        } catch (e) {
          console.error("Failed to parse profile:", e);
        }
      }

      // Generate welcome content with fixed templates
      const welcomeContent = generateWelcomeMessage(userName);

      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: welcomeContent,
        isAI: true,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to start new chat:", error);
    }
  };

  // Only show loading if user is not loaded OR conversation query is actively loading
  // Don't block on conversation data - it might be null for new conversations
  const isLoading = !user || conversationLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If conversation query failed, show error
  if (conversationError) {
    return (
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <p className="text-red-500">Fout bij laden van gesprek</p>
        <button 
          onClick={() => refetchConversation()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Probeer opnieuw
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with gradient */}
      <div
        className={`theme-${currentThemeId}-gradient px-6 py-4`}
        style={{
          background: `linear-gradient(90deg, ${currentTheme.colors.gradient[0]} 0%, ${currentTheme.colors.gradient[1]} 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{currentTheme.emoji}</span>
            <div>
              <h1 className="text-2xl font-bold text-white">Matti</h1>
              <p className="text-xs text-white/80">AI Chatbuddy</p>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="px-4 py-2 rounded-full hover:opacity-70 transition-opacity" style={{backgroundColor: 'rgba(255,255,255,0.3)'}}
          >
            <span className="text-white font-semibold text-sm">
              Nieuw Gesprek
            </span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 px-4 pt-4 pb-4 overflow-y-auto" style={{backgroundColor: '#e1edfe'}}
      >
        {messages.map((message, index) => (
          <ChatBubble 
            key={message.id} 
            message={message} 
            messageIndex={index}
            feedbackState={feedbackState[message.id]}
            onFeedback={(rating) => {
              if (rating === 'up') {
                // Thumbs up: submit immediately
                if (conversation) {
                  submitFeedback.mutateAsync({
                    conversationId: conversation.id,
                    messageIndex: index,
                    rating: 'up',
                  }).then(() => {
                    console.log('[Feedback] Thumbs up submitted');
                    setFeedbackState(prev => ({
                      ...prev,
                      [message.id]: { rating: 'up', showInput: false, text: '' }
                    }));
                  }).catch(error => {
                    console.error('[Feedback] Submission failed:', error);
                  });
                }
              } else {
                // Thumbs down: show input field
                setFeedbackState(prev => ({
                  ...prev,
                  [message.id]: { rating: 'down', showInput: true, text: '' }
                }));
              }
            }}
            onFeedbackTextChange={(text) => {
              setFeedbackState(prev => ({
                ...prev,
                [message.id]: { ...prev[message.id], text }
              }));
            }}
            onSubmitFeedback={async () => {
              const feedback = feedbackState[message.id];
              if (feedback && conversation) {
                try {
                  await submitFeedback.mutateAsync({
                    conversationId: conversation.id,
                    messageIndex: index,
                    rating: feedback.rating!,
                    feedbackText: feedback.text || undefined,
                  });
                  console.log('[Feedback] Submitted successfully');
                  // Hide feedback input after submission
                  setFeedbackState(prev => ({
                    ...prev,
                    [message.id]: { ...feedback, showInput: false }
                  }));
                } catch (error) {
                  console.error('[Feedback] Submission failed:', error);
                }
              }
            }}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 border-t border-border" style={{backgroundColor: '#f5f9ff'}}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type je bericht..."
            maxLength={500}
            disabled={isTyping}
            className="flex-1 text-foreground px-4 py-3 rounded-full text-base placeholder:text-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" style={{backgroundColor: '#e8f4f8'}}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !inputText.trim() || isTyping ? "opacity-50" : "hover:opacity-80"
            } transition-opacity`}
            style={{
              background: `linear-gradient(90deg, ${currentTheme.colors.gradient[0]} 0%, ${currentTheme.colors.gradient[1]} 100%)`,
            }}
          >
            <span className="text-white text-xl">↑</span>
          </button>
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <TabNavigation currentTab="chat" />
    </div>
  );
}

// Chat Bubble Component with feedback support
interface ChatBubbleProps {
  message: ChatMessage;
  messageIndex: number;
  feedbackState?: { rating: 'up' | 'down' | null; showInput: boolean; text: string };
  onFeedback?: (rating: 'up' | 'down') => void;
  onFeedbackTextChange?: (text: string) => void;
  onSubmitFeedback?: () => void;
}

function ChatBubble({ message, messageIndex, feedbackState, onFeedback, onFeedbackTextChange, onSubmitFeedback }: ChatBubbleProps) {
  const time = new Date(message.timestamp).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`mb-4 flex ${message.isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[80%] ${
          message.isAI ? "items-start" : "items-end"
        } flex flex-col`}
      >
        {/* AI Avatar */}
        {message.isAI && (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-1">
            <span className="text-lg">✨</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            message.isAI
              ? "bg-surface rounded-tl-sm border border-border"
              : "bg-primary rounded-tr-sm"
          }`}
        >
          <p
            className={`text-base leading-relaxed whitespace-pre-wrap ${
              message.isAI ? "text-foreground" : "text-black"
            }`}
          >
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-1 px-1">{time}</p>
        
        {/* Feedback UI (only for AI messages) */}
        {message.isAI && onFeedback && (
          <div className="mt-2 flex flex-col gap-2">
            {/* Thumbs up/down buttons */}
            {!feedbackState?.rating && (
              <div className="flex gap-2">
                <button
                  onClick={() => onFeedback('up')}
                  className="text-lg hover:scale-110 transition-transform"
                  aria-label="Thumbs up"
                >
                  👍
                </button>
                <button
                  onClick={() => onFeedback('down')}
                  className="text-lg hover:scale-110 transition-transform"
                  aria-label="Thumbs down"
                >
                  👎
                </button>
              </div>
            )}
            
            {/* Show selected rating */}
            {feedbackState?.rating && (
              <div className="text-sm text-muted-foreground">
                {feedbackState.rating === 'up' ? '👍 Bedankt voor je feedback!' : '👎 Wat ging er niet goed?'}
              </div>
            )}
            
            {/* Feedback text input (only for thumbs down) */}
            {feedbackState?.showInput && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={feedbackState.text}
                  onChange={(e) => onFeedbackTextChange?.(e.target.value)}
                  placeholder="Typ hier wat er niet goed ging..."
                  className="w-full px-3 py-2 text-sm text-black border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary bg-white"
                  rows={3}
                  maxLength={500}
                />
                <button
                  onClick={onSubmitFeedback}
                  className="self-end px-4 py-2 text-sm bg-primary rounded-lg hover:opacity-80 transition-opacity"
                  style={{color: '#150745'}}
                >
                  Verstuur feedback
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Typing Indicator Component (exact from original)
function TypingIndicator() {
  return (
    <div className="mb-4 flex justify-start">
      <div className="max-w-[80%] items-start flex flex-col">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-1">
          <span className="text-lg">✨</span>
        </div>

        {/* Typing Bubble */}
        <div className="bg-surface px-4 py-3 rounded-2xl rounded-tl-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
            <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
            <div className="w-2 h-2 rounded-full bg-primary typing-dot" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-1 px-1">
          Matti is aan het typen...
        </p>
      </div>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: "chat", label: "Chat", icon: "💬", path: "/chat" },
    { id: "history", label: "Geschiedenis", icon: "📜", path: "/history" },

    { id: "actions", label: "Acties", icon: "💪", path: "/actions" },
    { id: "profile", label: "Profiel", icon: "👤", path: "/profile" },
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
