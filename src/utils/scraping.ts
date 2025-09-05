// Utility functions for scraping and extraction

export function extractEmails(text: string): string[] {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
}

export function extractPhoneNumbers(text: string): string[] {
  return text.match(/\b\d{10,15}\b/g) || [];
}

export function extractImagesFromDOM(): string[] {
  return Array.from(document.images).map(img => img.src);
}
