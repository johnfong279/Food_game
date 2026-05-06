export const GAME_CLOSES_AT_ISO = "2026-05-25T03:59:00.000Z";
export const GAME_CLOSES_AT_MS = new Date(GAME_CLOSES_AT_ISO).getTime();

export function isGameClosed(now = Date.now()) {
  return now >= GAME_CLOSES_AT_MS;
}
