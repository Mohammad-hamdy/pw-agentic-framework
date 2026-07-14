import { APIRequestContext } from '@playwright/test';
import { LoginRequestBuilder } from '@api/model/LoginRequestBuilder';
import { AuthService } from '@api/service/AuthService';

/**
 * Request-flow layer: high-level business workflows that hide the details of
 * building payloads and chaining service calls from the test files. Tests call
 * a flow (e.g. authenticate) and get back what they need (e.g. a token).
 */
export class AuthFlow {
  private service: AuthService;

  constructor(request: APIRequestContext, baseApiUrl: string) {
    this.service = new AuthService(request, baseApiUrl);
  }

  async authenticate(username: string, password: string): Promise<string> {
    const payload = new LoginRequestBuilder()
      .setUsername(username)
      .setPassword(password)
      .build();

    const response = await this.service.login(payload);
    if (!response.ok()) {
      throw new Error(`Authentication failed with status ${response.status()}`);
    }
    const body = await response.json();
    return body.access_token;
  }
}
