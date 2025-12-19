export function estimateTokensFromText(text: string) {
  const normalized = text.replace(/\s+/g, "");
  return Math.max(1, Math.round(normalized.length / 4));
}

export function estimateTokens(messages: Array<{ content: string }>) {
  if (!messages.length) {
    return 0;
  }
  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.max(1, Math.round(totalChars / 4));
}
