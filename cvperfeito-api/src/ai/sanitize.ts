export function sanitizeResumeText(text: string): string {
  let cleaned = text.slice(0, 15000);

  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /ignore\s+above/gi,
    /you\s+are\s+now/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\|im_start\|>/gi,
    /```system/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    cleaned = cleaned.replace(pattern, '[REMOVED]');
  }

  return cleaned.trim();
}