import RegionConfig from "./region";

export default function getApiUrl() {
  const API_URL = window.API_URL ?? RegionConfig.getUrl("api");

  return API_URL;
}
