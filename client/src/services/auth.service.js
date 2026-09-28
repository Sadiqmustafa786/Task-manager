import http from "./http";

/** @returns {Promise<Object>} Current user from `/auth/me`. */
export async function fetchCurrentUser() {
  const { data } = await http.get("/auth/me");
  return data.user;
}

export async function logout() {
  await http.post("/auth/logout");
}

export function getGoogleOAuthUrl() {
  return `${import.meta.env.VITE_API_URL}/api/auth/google`;
}
