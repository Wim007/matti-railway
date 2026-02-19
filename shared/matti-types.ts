// Exact types from original Matti app

export type ThemeId = 
  | 'general'
  | 'school'
  | 'friends'
  | 'home'
  | 'feelings'
  | 'love'
  | 'freetime'
  | 'future'
  | 'self'
  | 'bullying';

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  description: string;
  colors: {
    bg: string;
    text: string;
    gradient: [string, string];
  };
}

export interface ChatMessage {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  birthYear: number;
  birthdate?: string;
  ageGroup?: '12-13' | '14-15' | '16-17' | '18-21';
  postalCode: string;
  gender: 'boy' | 'girl' | 'other' | 'prefer_not_to_say' | '';
  analyticsConsent: boolean;
  themeSuggestionsEnabled?: boolean;
  createdAt: string;
}

export const THEMES: Theme[] = [
  {
    id: 'general',
    name: 'Algemeen',
    emoji: '💬',
    description: 'Voor alles wat je wilt bespreken',
    colors: { bg: '#8B5CF6', text: '#FFFFFF', gradient: ['#8B5CF6', '#A78BFA'] }
  },
  {
    id: 'school',
    name: 'School',
    emoji: '📚',
    description: 'Huiswerk, toetsen, en schoolstress',
    colors: { bg: '#3B82F6', text: '#FFFFFF', gradient: ['#3B82F6', '#60A5FA'] }
  },
  {
    id: 'friends',
    name: 'Vrienden',
    emoji: '👥',
    description: 'Vriendschap, ruzie, en sociale dingen',
    colors: { bg: '#10B981', text: '#FFFFFF', gradient: ['#10B981', '#34D399'] }
  },
  {
    id: 'home',
    name: 'Thuis',
    emoji: '🏠',
    description: 'Familie, ouders, en thuissituatie',
    colors: { bg: '#F97316', text: '#FFFFFF', gradient: ['#F97316', '#FB923C'] }
  },
  {
    id: 'feelings',
    name: 'Gevoelens',
    emoji: '💭',
    description: 'Emoties, stress, en hoe je je voelt',
    colors: { bg: '#EC4899', text: '#FFFFFF', gradient: ['#EC4899', '#F472B6'] }
  },
  {
    id: 'love',
    name: 'Liefde',
    emoji: '❤️',
    description: 'Relaties, crushes, en liefde',
    colors: { bg: '#EF4444', text: '#FFFFFF', gradient: ['#EF4444', '#F87171'] }
  },
  {
    id: 'freetime',
    name: 'Vrije tijd',
    emoji: '🎮',
    description: "Hobby's, sport, en ontspanning",
    colors: { bg: '#FBBF24', text: '#000000', gradient: ['#FBBF24', '#FCD34D'] }
  },
  {
    id: 'future',
    name: 'Toekomst',
    emoji: '🎯',
    description: 'Dromen, plannen, en je toekomst',
    colors: { bg: '#06B6D4', text: '#FFFFFF', gradient: ['#06B6D4', '#22D3EE'] }
  },
  {
    id: 'self',
    name: 'Jezelf',
    emoji: '🌟',
    description: 'Wie je bent en wie je wilt zijn',
    colors: { bg: '#6366F1', text: '#FFFFFF', gradient: ['#6366F1', '#818CF8'] }
  },
  {
    id: 'bullying',
    name: 'Pesten',
    emoji: '🚫',
    description: 'Pesten, gepest worden, en hulp zoeken',
    colors: { bg: '#DC2626', text: '#FFFFFF', gradient: ['#DC2626', '#EF4444'] }
  }
];

export const AGE_RANGE = {
  MIN: 12,
  MAX: 21
};

export const GENDER_OPTIONS = [
  { value: 'boy', label: 'Jongen', emoji: '👦', color: '#a5c7f3' },
  { value: 'girl', label: 'Meisje', emoji: '👧', color: '#deb4e4' },
  { value: 'other', label: 'Anders', emoji: '🌈', color: '#a2f1d9' },
  { value: 'prefer_not_to_say', label: 'Zeg ik liever niet', emoji: '🤐', color: '#c5e4be' }
];
