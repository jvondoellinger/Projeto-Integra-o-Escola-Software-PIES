const apiUrl = import.meta.env.VITE_PIES_API_URL;
const sessionKey = "pies-supabase-session";
let sessionToken;

function storeToken(token) {
  sessionToken = token;
  try {
    if (token) sessionStorage.setItem(sessionKey, token);
    else sessionStorage.removeItem(sessionKey);
  } catch {
    // The current tab can keep the session in memory.
  }
}

function currentToken() {
  if (sessionToken !== undefined) return sessionToken;
  try {
    return sessionStorage.getItem(sessionKey);
  } catch {
    return null;
  }
}

export async function pagesRequest(path, data) {
  const token = currentToken();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ path, data }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "login") storeToken(null);
    throw Object.assign(
      new Error(
        result.message || "Não foi possível acessar os dados escolares.",
      ),
      {
        status: response.status,
      },
    );
  }
  if (path === "login") storeToken(result.token);
  if (path === "logout") storeToken(null);
  return result;
}
