/**
 * Mail.tm API helper — real disposable email inboxes for E2E tests.
 * Docs: https://docs.mail.tm/
 */

const BASE = 'https://api.mail.tm';

export interface MailTmAccount {
  id: string;
  address: string;
  password: string;
  token: string;
}

export interface MailTmMessage {
  id: string;
  from: { address: string; name: string };
  to: Array<{ address: string; name: string }>;
  subject: string;
  intro: string;
  createdAt: string;
  seen: boolean;
}

export interface MailTmMessageDetail extends MailTmMessage {
  html: string[] | null;
  text: string | null;
}

// ─── Account management ─────────────────────────────────────────────────────

async function getFirstAvailableDomain(): Promise<string> {
  const res = await fetch(`${BASE}/domains?page=1`);
  if (!res.ok) throw new Error(`mail.tm /domains failed: ${res.status}`);
  const body = await res.json();
  const members: Array<{ domain: string; isActive: boolean }> = body['hydra:member'] ?? [];
  const active = members.find((d) => d.isActive);
  if (!active) throw new Error('No active mail.tm domains found');
  return active.domain;
}

async function createAccount(address: string, password: string): Promise<{ id: string; address: string }> {
  const res = await fetch(`${BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mail.tm create account failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function getToken(address: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`mail.tm get token failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return data.token as string;
}

/**
 * Create a new disposable inbox.
 * Returns account details including the JWT token needed for all subsequent calls.
 */
export async function createMailTmInbox(): Promise<MailTmAccount> {
  const domain = await getFirstAvailableDomain();
  const localPart = `maabar-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const address = `${localPart}@${domain}`;
  const password = `E2eInbox!${Date.now()}`;

  const account = await createAccount(address, password);
  const token = await getToken(address, password);

  console.log(`[mail-tm] Created inbox: ${address}`);
  return { id: account.id, address, password, token };
}

// ─── Message retrieval ────────────────────────────────────────────────────────

/**
 * List all messages in the inbox (latest first, page 1 = newest 30).
 */
export async function getMessages(token: string): Promise<MailTmMessage[]> {
  const res = await fetch(`${BASE}/messages?page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`mail.tm list messages failed: ${res.status}`);
  const body = await res.json();
  return (body['hydra:member'] ?? []) as MailTmMessage[];
}

/**
 * Fetch full message details including HTML body.
 */
export async function getMessageDetail(token: string, id: string): Promise<MailTmMessageDetail> {
  const res = await fetch(`${BASE}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`mail.tm get message ${id} failed: ${res.status}`);
  return res.json() as Promise<MailTmMessageDetail>;
}

// ─── Polling ─────────────────────────────────────────────────────────────────

export interface PollOptions {
  /** Maximum wait time in ms (default 60 000) */
  maxWaitMs?: number;
  /** Poll interval in ms (default 3 000) */
  intervalMs?: number;
  /** Optional predicate — if provided, keeps polling until a matching message is found */
  filter?: (msg: MailTmMessage) => boolean;
  /** Only look at messages newer than this ISO date (useful for "since last check") */
  newerThan?: string;
}

/**
 * Poll until at least one message matching the filter arrives.
 * Throws if maxWaitMs elapses with no match.
 */
export async function pollForEmail(token: string, opts: PollOptions = {}): Promise<MailTmMessage> {
  const {
    maxWaitMs = 60_000,
    intervalMs = 3_000,
    filter,
    newerThan,
  } = opts;

  const deadline = Date.now() + maxWaitMs;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    const messages = await getMessages(token).catch((e) => {
      console.warn(`[mail-tm] poll attempt ${attempt} failed: ${e.message}`);
      return [] as MailTmMessage[];
    });

    const candidates = newerThan
      ? messages.filter((m) => new Date(m.createdAt) > new Date(newerThan))
      : messages;

    const match = filter ? candidates.find(filter) : candidates[0];

    if (match) {
      console.log(`[mail-tm] Email arrived after ${Math.round((Date.now() - deadline + maxWaitMs) / 1000)}s: "${match.subject}" from ${match.from.address}`);
      return match;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(intervalMs, remaining));
  }

  const last = await getMessages(token).catch(() => []);
  throw new Error(
    `[mail-tm] No matching email arrived within ${maxWaitMs / 1000}s.\n` +
    `Inbox has ${last.length} message(s): ${last.map((m) => `"${m.subject}" (${m.from.address})`).join(', ') || 'none'}`,
  );
}

/**
 * Wait until at least `count` messages exist in the inbox.
 * Returns all messages once the threshold is met.
 */
export async function waitForMessageCount(
  token: string,
  count: number,
  maxWaitMs = 30_000,
): Promise<MailTmMessage[]> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const msgs = await getMessages(token);
    if (msgs.length >= count) return msgs;
    await sleep(3_000);
  }
  const msgs = await getMessages(token);
  throw new Error(`Expected ${count} message(s) in inbox, got ${msgs.length} after ${maxWaitMs / 1000}s`);
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
