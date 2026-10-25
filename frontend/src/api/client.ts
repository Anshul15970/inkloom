import { AuthTokens, UserProfile } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem("inkloom_access_token");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("inkloom_refresh_token");
  }

  public setTokens(tokens: { access_token: string; refresh_token: string }) {
    localStorage.setItem("inkloom_access_token", tokens.access_token);
    localStorage.setItem("inkloom_refresh_token", tokens.refresh_token);
  }

  public clearTokens() {
    localStorage.removeItem("inkloom_access_token");
    localStorage.removeItem("inkloom_refresh_token");
  }

  public hasTokens(): boolean {
    return !!this.getAccessToken();
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const token = this.getAccessToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration & automatic refresh
    if (response.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers.set("Authorization", `Bearer ${this.getAccessToken()}`);
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      let errorDetail = "An unexpected error occurred.";
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(errorDetail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      this.setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // --- Auth Endpoints ---

  async registerBrand(data: {
    email: string;
    password: string;
    full_name: string;
    brand_name: string;
    brand_slug: string;
    website?: string;
  }): Promise<AuthTokens> {
    const res = await this.request<AuthTokens>("/auth/register-brand", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setTokens(res);
    return res;
  }

  async registerCreator(data: {
    email: string;
    password: string;
    full_name: string;
    invitation_token?: string;
  }): Promise<AuthTokens> {
    const res = await this.request<AuthTokens>("/auth/register-creator", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setTokens(res);
    return res;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const res = await this.request<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    this.setTokens(res);
    return res;
  }

  async logout(): Promise<void> {
    const refresh_token = this.getRefreshToken();
    try {
      if (refresh_token) {
        await this.request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token }),
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/auth/me");
  }

  async updateProfile(fullName: string): Promise<UserProfile> {
    return this.request<UserProfile>("/auth/me/profile", {
      method: "PUT",
      body: JSON.stringify({ full_name: fullName }),
    });
  }

  async updatePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // --- Brand Endpoints ---

  async listUserBrands(): Promise<Array<{ id: string; name: string; slug: string; role: string }>> {
    return this.request<Array<{ id: string; name: string; slug: string; role: string }>>("/brands");
  }

  async getBrand(brandId: string): Promise<{ id: string; name: string; slug: string; description: string; website: string }> {
    return this.request(`/brands/${brandId}`);
  }

  async getBrandMembers(brandId: string): Promise<Array<{
    membership_id: string;
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    joined_at: string;
  }>> {
    return this.request(`/brands/${brandId}/members`);
  }

  async inviteMember(brandId: string, email: string, role: string): Promise<{
    id: string;
    email: string;
    role: string;
    invitation_token: string;
  }> {
    return this.request(`/brands/${brandId}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  // --- Invitations ---

  async verifyInvitation(token: string): Promise<{
    brand_name: string;
    brand_slug: string;
    invited_email: string;
    role: string;
    is_valid: boolean;
  }> {
    return this.request(`/invitations/verify?token=${encodeURIComponent(token)}`);
  }

  async acceptInvitation(token: string): Promise<{
    brand_id: string;
    brand_name: string;
    role: string;
    message: string;
  }> {
    return this.request("/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }
}

export const api = new ApiClient();
