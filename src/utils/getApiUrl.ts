export default function getApiUrl() {
  const API_URL = window.API_URL ?? import.meta.env.VITE_ONE_API_URL;

  return API_URL;
}

declare global {
  interface Window {
    API_URL?: string;
  }
}
