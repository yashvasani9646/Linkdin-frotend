import { API_CONFIG } from "../config/api.config";

/**
 * Resolve a stored file path (e.g. "/uploads/resumes/xyz.pdf") into a URL the
 * browser can open. Absolute, data and blob URLs are returned untouched.
 */
export const toAssetUrl = (path = "") => {
  if (!path || typeof path !== "string") return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_CONFIG.BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default toAssetUrl;
