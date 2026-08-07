import { handleClientFallbackRequest } from './clientStore';

export async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      if (isJson) {
        try {
          const errorData = await res.json();
          const errorMessage = errorData.message || errorData.error || `API request failed (${res.status})`;
          throw new Error(errorMessage);
        } catch (e: any) {
          if (e.message && !e.message.includes('API request failed')) throw e;
        }
      }
      
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<head')) {
        console.warn(`[Client Store Fallback] Endpoint '${url}' returned HTML. Executing operation in client localStorage.`);
        return handleClientFallbackRequest(url, options) as T;
      }
      throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
    }

    if (!isJson) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<head')) {
        console.warn(`[Client Store Fallback] Endpoint '${url}' returned HTML instead of JSON. Executing operation in client localStorage.`);
        return handleClientFallbackRequest(url, options) as T;
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        return handleClientFallbackRequest(url, options) as T;
      }
    }

    return await res.json();
  } catch (err: any) {
    if (err.message && (err.message.includes('<!DOCTYPE') || err.message.includes('HTML') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      console.warn(`[Client Store Fallback] Network or HTML error calling '${url}'. Executing in client localStorage.`, err);
      return handleClientFallbackRequest(url, options) as T;
    }
    throw err;
  }
}
