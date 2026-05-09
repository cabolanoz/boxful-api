import { randomUUID } from 'crypto';

export function generateTrackingCode(): string {
  return `BOX-${randomUUID().slice(0, 8).toUpperCase()}`;
}
