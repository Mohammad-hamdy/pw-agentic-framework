import { APIRequestContext } from '@playwright/test';
import { LoginRequestPayload } from '@api/model/LoginRequestBuilder';

/**
 * Service layer: raw HTTP calls only, single responsibility. It wraps
 * Playwright's APIRequestContext and knows nothing about test orchestration.
 */
export class AuthService {
  private request: APIRequestContext;
  private baseApiUrl: string;

  constructor(request: APIRequestContext, baseApiUrl: string) {
    this.request = request;
    this.baseApiUrl = baseApiUrl;
  }

  async login(payload: LoginRequestPayload) {
    return this.request.post(`${this.baseApiUrl}/auth/login`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
