# Matti App - Exact UI Specifications

## Theme Colors & Gradients (from app/(tabs)/index.tsx lines 57-67)

```typescript
const THEME_COLORS = {
  general: { bg: '#8B5CF6', text: '#FFFFFF', gradient: ['#8B5CF6', '#A78BFA'] },
  school: { bg: '#3B82F6', text: '#FFFFFF', gradient: ['#3B82F6', '#60A5FA'] },
  friends: { bg: '#10B981', text: '#FFFFFF', gradient: ['#10B981', '#34D399'] },
  home: { bg: '#F97316', text: '#FFFFFF', gradient: ['#F97316', '#FB923C'] },
  feelings: { bg: '#EC4899', text: '#FFFFFF', gradient: ['#EC4899', '#F472B6'] },
  love: { bg: '#EF4444', text: '#FFFFFF', gradient: ['#EF4444', '#F87171'] },
  freetime: { bg: '#FBBF24', text: '#000000', gradient: ['#FBBF24', '#FCD34D'] },
  future: { bg: '#06B6D4', text: '#FFFFFF', gradient: ['#06B6D4', '#22D3EE'] },
  self: { bg: '#6366F1', text: '#FFFFFF', gradient: ['#6366F1', '#818CF8'] },
};
```

## Chat Screen Header (lines 534-590)

- LinearGradient with theme colors (gradient start x:0 y:0, end x:1 y:0)
- Padding: px-6 py-4
- Layout: flex-row items-center justify-between
- Left side:
  - Theme emoji (text-3xl)
  - "Matti" (text-2xl font-bold text-white)
  - "AI Chatbuddy" (text-xs text-white/80)
- Right side:
  - "Nieuw Gesprek" button
  - Background: bg-white/20
  - Padding: px-4 py-2
  - Border radius: rounded-full
  - Active state: active:opacity-70

## Chat Messages Area (lines 593-606)

- ScrollView with:
  - className: flex-1 px-4
  - contentContainerStyle: paddingTop: 16, paddingBottom: 16
  - showsVerticalScrollIndicator: false
- Messages mapped with ChatBubble component
- TypingIndicator shown when isTyping

## Input Area (lines 608-647)

- Container: px-4 pb-4 pt-2 border-t border-border bg-background
- Layout: flex-row items-center gap-2
- TextInput:
  - className: flex-1 bg-surface text-foreground px-4 py-3 rounded-full text-base
  - placeholder: "Type je bericht..."
  - placeholderTextColor: colors.muted
  - multiline: true
  - maxLength: 500
- Send button:
  - LinearGradient with theme colors
  - Size: w-12 h-12 rounded-full
  - Icon: "↑" (text-white text-xl)
  - Disabled opacity: 0.5

## Welcome Messages (lines 246-263)

Randomized greeting structure:
- Greetings: ['Hé', 'Hey', 'Yo']
- Phrases: ['Chill dat je er bent!', 'Goed dat je er bent!', 'Leuk dat je er bent!', 'Wat fijn dat je er bent!']
- Emojis: ['👋', '✨', '😊', '💬', '🎯']
- Format: "{greeting} {userName}! {phrase} {emoji}\n\nWaar wil je het over hebben?"

## Theme Definitions (from lib/theme-types.ts)

```typescript
export const THEMES = [
  { id: 'general', name: 'Algemeen', emoji: '💬', description: 'Voor alles wat je wilt bespreken' },
  { id: 'school', name: 'School', emoji: '📚', description: 'Huiswerk, toetsen, en schoolstress' },
  { id: 'friends', name: 'Vrienden', emoji: '👥', description: 'Vriendschap, ruzie, en sociale dingen' },
  { id: 'home', name: 'Thuis', emoji: '🏠', description: 'Familie, ouders, en thuissituatie' },
  { id: 'feelings', name: 'Gevoelens', emoji: '💭', description: 'Emoties, stress, en hoe je je voelt' },
  { id: 'love', name: 'Liefde', emoji: '❤️', description: 'Relaties, crushes, en liefde' },
  { id: 'freetime', name: 'Vrije tijd', emoji: '🎮', description: 'Hobby\'s, sport, en ontspanning' },
  { id: 'future', name: 'Toekomst', emoji: '🎯', description: 'Dromen, plannen, en je toekomst' },
  { id: 'self', name: 'Jezelf', emoji: '🌟', description: 'Wie je bent en wie je wilt zijn' },
];
```

## Onboarding Screens

### Welcome (app/onboarding/welcome.tsx)
- Will extract exact layout and text

### Account (app/onboarding/account.tsx)
- Will extract exact form fields and labels

### Age (app/onboarding/age.tsx)
- Will extract exact input and validation

### Gender (app/onboarding/gender.tsx)
- Will extract exact options and layout

### Themes Explanation (app/onboarding/themes-explanation.tsx)
- Will extract exact content

## Tab Navigation

From app/(tabs)/_layout.tsx:
- Bottom tab bar
- Tabs: index (Chat), history, themes, profile, parent-info
- Icons and labels (exact from code)

## Session Timeout

From lib/session-manager.ts:
- 5 minute timeout (300000ms)
- Stored in localStorage as 'matti_last_active'

## Follow-up Intervals (from knowledge)

Matti-specific: [2, 4, 7, 10, 14, 21] days
