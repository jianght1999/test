
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ImageData {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface AnalysisResult {
  summary: string;
  tags: string[];
}
