/**
 * Generate a random hex avatar color from a curated palette.
 * Bright, distinguishable colors for live cursors.
 */
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5DBDB', '#E59866',
] as const;

export const getRandomAvatarColor = (): string => {
  const index = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[index] ?? AVATAR_COLORS[0]!;
};

/**
 * Sleep utility for delays in tests or workers.
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sanitize a string for safe display (basic XSS prevention).
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
