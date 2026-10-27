/**
 * Support for overriding the chat widget URL via a global variable,
 * to support using the SDK against a local or staging widget.
 */
export default function getChatWidgetUrl() {
  return (
    window.MONEYHASH_CHAT_WIDGET_URL ?? import.meta.env.VITE_CHAT_WIDGET_URL
  );
}

declare global {
  interface Window {
    MONEYHASH_CHAT_WIDGET_URL?: string;
  }
}
