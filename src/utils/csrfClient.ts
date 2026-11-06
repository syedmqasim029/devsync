let cachedCsrfToken: string | null = null;
let inFlightCsrfPromise: Promise<string | null> | null = null;

export async function getCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (inFlightCsrfPromise) return inFlightCsrfPromise;

  inFlightCsrfPromise = fetch('/api/auth/csrf', {
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as { csrfToken?: string };
      cachedCsrfToken = data.csrfToken || null;
      return cachedCsrfToken;
    })
    .catch(() => null)
    .finally(() => {
      inFlightCsrfPromise = null;
    });

  return inFlightCsrfPromise;
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getCsrfToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('x-csrf-token', token);
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}
