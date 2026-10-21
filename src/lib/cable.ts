// src/lib/cable.ts
import { createConsumer, type Subscription } from '@rails/actioncable';

let consumer: ReturnType<typeof createConsumer> | null = null;
let currentToken: string | null = null;

const getToken = () => localStorage.getItem('access_token');

const getWebSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;

  // Fallback based on current page protocol (ws for http, wss for https)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host || 'localhost:3000';
  return `${protocol}//${host}`;
};

export const initCable = (token?: string) => {
  const authToken = token || getToken();
  if (!authToken) {
    console.warn('[Cable] No auth token found. Cannot initialize ActionCable.');
    return;
  }

  // Reuse existing consumer if token unchanged
  if (consumer && currentToken === authToken) {
    console.log('[Cable] Consumer already initialized.');
    return;
  }

  // Clean up previous consumer if token changed
  if (consumer) {
    try {
      consumer.disconnect();
    } catch (e) {
      console.warn('[Cable] Error disconnecting previous consumer:', e);
    }
  }

  const wsBase = getWebSocketUrl();
  const wsUrl = `${wsBase}/cable?token=${authToken}`;
  console.log('[Cable] Connecting to', wsUrl.replace(authToken, '****'));

  consumer = createConsumer(wsUrl);
  currentToken = authToken;

  // Attach to window for debugging / other uses
  (window as any).App = { ...(window as any).App, cable: consumer };
};

export const getConsumer = () => {
  if (!consumer) {
    console.warn('[Cable] Consumer not initialized. Call initCable first.');
  }
  return consumer;
};

export const disconnectCable = () => {
  if (consumer) {
    try {
      consumer.disconnect();
    } catch (e) {
      console.warn('[Cable] Error disconnecting:', e);
    }
    consumer = null;
    currentToken = null;
    console.log('[Cable] Disconnected.');
  }
};

/**
 * Subscribe to the PartnerBoardChannel.
 * @param callbacks - callbacks for received, connected, disconnected, rejected
 * @returns Subscription object, or null if consumer not available
 */
export const subscribeToPartnerBoard = (
  callbacks: {
    received?: (data: any) => void;
    connected?: () => void;
    disconnected?: () => void;
    rejected?: () => void;
  } = {}
): Subscription | null => {
  const cable = getConsumer();
  if (!cable) {
    console.error('[Cable] Cannot subscribe to PartnerBoardChannel - no consumer.');
    return null;
  }

  return cable.subscriptions.create(
    { channel: 'PartnerBoardChannel' },
    {
      received(data: any) {
        if (callbacks.received) callbacks.received(data);
      },
      connected() {
        console.log('[Cable] PartnerBoardChannel connected.');
        if (callbacks.connected) callbacks.connected();
      },
      disconnected() {
        console.log('[Cable] PartnerBoardChannel disconnected.');
        if (callbacks.disconnected) callbacks.disconnected();
      },
      rejected() {
        console.warn('[Cable] PartnerBoardChannel subscription rejected.');
        if (callbacks.rejected) callbacks.rejected();
      }
    }
  );
};

/**
 * Subscribe to the SellerOrdersChannel.
 * @param callbacks - callbacks for received, connected, disconnected, rejected
 * @returns Subscription object, or null if consumer not available
 */
export const subscribeToSellerOrders = (
  callbacks: {
    received?: (data: any) => void;
    connected?: () => void;
    disconnected?: () => void;
    rejected?: () => void;
  } = {}
): Subscription | null => {
  const cable = getConsumer();
  if (!cable) {
    console.error('[Cable] Cannot subscribe to SellerOrdersChannel - no consumer.');
    return null;
  }

  return cable.subscriptions.create(
    { channel: 'SellerOrdersChannel' },
    {
      received(data: any) {
        if (callbacks.received) callbacks.received(data);
      },
      connected() {
        console.log('[Cable] SellerOrdersChannel connected.');
        if (callbacks.connected) callbacks.connected();
      },
      disconnected() {
        console.log('[Cable] SellerOrdersChannel disconnected.');
        if (callbacks.disconnected) callbacks.disconnected();
      },
      rejected() {
        console.warn('[Cable] SellerOrdersChannel subscription rejected.');
        if (callbacks.rejected) callbacks.rejected();
      }
    }
  );
};