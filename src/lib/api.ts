import { DashboardData } from '../types';

export async function apiFetch<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let errorMessage = `API request failed (${res.status} ${res.statusText})`;
    if (isJson) {
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Fallback
      }
    } else {
      const text = await res.text();
      if (text.includes('The page') || text.includes('<!DOCTYPE') || text.includes('<html')) {
        errorMessage = `The API endpoint '${url}' returned an HTML page (${res.status}). Ensure the backend server is running or API routes are configured on Vercel.`;
      } else if (text) {
        errorMessage = text.slice(0, 150);
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await res.text();
    if (text.includes('The page') || text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`The endpoint '${url}' returned HTML instead of JSON. Ensure Vercel serverless API routes or Express backend is active.`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from '${url}': ${text.slice(0, 100)}`);
    }
  }

  return await res.json();
}
