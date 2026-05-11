type CursorPayload = { at: string; id: string };

export function encodeCursor(at: string, id: string): string {
  return Buffer.from(JSON.stringify({ at, id } satisfies CursorPayload)).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const obj = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as unknown;
    if (typeof obj === 'object' && obj !== null && 'at' in obj && 'id' in obj) {
      return obj as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}
