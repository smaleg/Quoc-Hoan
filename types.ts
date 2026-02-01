
export enum Language {
  TIBETAN = 'Tibetan',
  VIETNAMESE = 'Vietnamese'
}

export interface TranslationResult {
  translatedText: string;
  transliteration?: string;
  grammarAnalysis?: string;
  examples: {
    original: string;
    translated: string;
  }[];
  etymology?: string;
}

export interface HistoryItem {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: Language;
  targetLang: Language;
  timestamp: number;
}
