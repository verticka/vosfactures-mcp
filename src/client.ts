// src/client.ts

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const MESSAGES_ERREUR: Record<number, string> = {
  401: 'Token API invalide (401)',
  403: 'Accès refusé (403)',
  404: 'Ressource introuvable (404)',
  422: 'Données invalides (422)',
  500: 'Erreur serveur VosFactures (500)',
};

export class VosFacturesClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiToken: string
  ) {}

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('api_token', this.apiToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const message = MESSAGES_ERREUR[response.status] ?? `Erreur inattendue (${response.status})`;
      let detail = '';
      try {
        const errBody = await response.json() as Record<string, unknown>;
        if (errBody?.message) detail = ` : ${errBody.message}`;
        else if (errBody?.error) detail = ` : ${errBody.error}`;
      } catch { /* pas de body JSON */ }
      throw new Error(message + detail);
    }

    try {
      return await response.json() as T;
    } catch {
      throw new Error(`Réponse non-JSON reçue du serveur VosFactures (${response.status})`);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export function creerClient(): VosFacturesClient {
  const token = process.env.VOSFACTURES_API_TOKEN;
  const url = process.env.VOSFACTURES_URL;

  if (!token) {
    throw new Error(
      'Variable d\'environnement VOSFACTURES_API_TOKEN manquante.\n' +
      'Trouvez votre token dans : Paramètres > Intégration > Code d\'autorisation API'
    );
  }
  if (!url) {
    throw new Error(
      'Variable d\'environnement VOSFACTURES_URL manquante.\n' +
      'Exemple : https://moncompte.vosfactures.fr'
    );
  }

  return new VosFacturesClient(url, token);
}
