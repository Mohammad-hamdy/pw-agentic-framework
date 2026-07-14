/**
 * Builder-pattern payload model. Use fluent setters to assemble request bodies,
 * then call build() to get the plain object sent to the service layer.
 *
 * This is the template the generator agent follows when a story needs API setup.
 */
export interface LoginRequestPayload {
  username: string;
  password: string;
  rememberMe: boolean;
}

export class LoginRequestBuilder {
  private payload: LoginRequestPayload = {
    username: '',
    password: '',
    rememberMe: false,
  };

  setUsername(username: string): this {
    this.payload.username = username;
    return this;
  }

  setPassword(password: string): this {
    this.payload.password = password;
    return this;
  }

  setRememberMe(rememberMe: boolean): this {
    this.payload.rememberMe = rememberMe;
    return this;
  }

  build(): LoginRequestPayload {
    if (!this.payload.username || !this.payload.password) {
      throw new Error('LoginRequestBuilder: username and password are required');
    }
    return { ...this.payload };
  }
}
