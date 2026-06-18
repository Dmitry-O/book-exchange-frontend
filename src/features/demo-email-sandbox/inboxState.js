export const DEMO_INBOX_STATE_EVENT = "book-exchange:demo-inbox-state-changed";

const READ_MESSAGES_STORAGE_PREFIX = "book-exchange/demo-email-read-messages/";

export function getUnreadDemoEmailCount(sandboxId, messages = []) {
  if (!sandboxId) {
    return 0;
  }

  const readIds = readMessageIds(sandboxId);

  return messages.filter((message) => message?.id && !readIds.has(message.id)).length;
}

export function isDemoEmailRead(sandboxId, messageId) {
  return Boolean(sandboxId && messageId && readMessageIds(sandboxId).has(messageId));
}

export function markDemoEmailAsRead(sandboxId, messageId) {
  if (typeof window === "undefined" || !sandboxId || !messageId) {
    return;
  }

  const readIds = readMessageIds(sandboxId);

  if (readIds.has(messageId)) {
    return;
  }

  readIds.add(messageId);

  try {
    window.localStorage.setItem(
      `${READ_MESSAGES_STORAGE_PREFIX}${sandboxId}`,
      JSON.stringify([...readIds])
    );
  } catch {
    // Reading a demo email still works when localStorage is unavailable.
  }

  window.dispatchEvent(new Event(DEMO_INBOX_STATE_EVENT));
}

function readMessageIds(sandboxId) {
  if (typeof window === "undefined" || !sandboxId) {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(`${READ_MESSAGES_STORAGE_PREFIX}${sandboxId}`);
    const parsed = raw ? JSON.parse(raw) : [];

    return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : []);
  } catch {
    return new Set();
  }
}
