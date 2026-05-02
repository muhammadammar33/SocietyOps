import {
  AuthResponse,
  Billing,
  Complaint,
  CreateSocietyPayload,
  House,
  Resident,
  Society,
  User,
  VisitorLog,
} from "../components/home/types";

export type ApiClient = {
  login: (phone: string, password: string) => Promise<AuthResponse>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    cnic: string;
    password: string;
    role: "RESIDENT_OWNER" | "SOCIETY_ADMIN";
    societyId?: string;
  }) => Promise<AuthResponse>;
  me: (token: string) => Promise<User>;
  updateProfile: (
    token: string,
    payload: Partial<{
      name: string;
      email: string;
      phone: string;
      cnic: string;
    }>,
  ) => Promise<User>;
  societies: (token: string) => Promise<Society[]>;
  society: (token: string, id: string) => Promise<Society>;
  residents: (token: string) => Promise<Resident[]>;
  houses: (token: string) => Promise<House[]>;
  billings: (token: string) => Promise<Billing[]>;
  complaints: (token: string) => Promise<Complaint[]>;
  visitors: (token: string) => Promise<VisitorLog[]>;
  createSociety: (token: string, payload: CreateSocietyPayload) => Promise<Society>;
  createSocietyAdmin: (
    token: string,
    payload: {
      name: string;
      email: string;
      phone: string;
      cnic: string;
      password: string;
      societyId: string;
    },
  ) => Promise<AuthResponse>;
  createHouse: (
    token: string,
    payload: { societyId: string; type?: string; block: string; houseNumber: string; ownerId?: string; status?: string },
  ) => Promise<House>;
  updateHouse: (token: string, id: string, payload: Partial<{ type: string; block: string; houseNumber: string; ownerId: string | null; status: string }>) => Promise<House>;
  updateHouseResidentCount: (
    token: string,
    id: string,
    residentCount: number,
  ) => Promise<House>;
  createBilling: (
    token: string,
    payload: {
      houseId: string;
      description: string;
      amount: number;
      dueDate: string;
      status?: string;
    },
  ) => Promise<Billing>;
  updateBilling: (token: string, id: string, payload: Partial<{ status: string; amount: number; dueDate: string }>) => Promise<Billing>;
  createVisitor: (
    token: string,
    payload: { houseId: string; visitorName: string; entryTime: string; exitTime?: string },
  ) => Promise<VisitorLog>;
  updateVisitor: (token: string, id: string, payload: Partial<{ exitTime: string }>) => Promise<VisitorLog>;
  updateComplaint: (token: string, id: string, payload: Partial<{ status: string; description: string }>) => Promise<Complaint>;
  createComplaint: (
    token: string,
    payload: {
      userId: string;
      houseId: string;
      description: string;
      category?: "ISSUE" | "QUERY";
      status?: string;
    },
  ) => Promise<Complaint>;
  createResident: (
    token: string,
    payload: {
      name: string;
      email: string;
      phone: string;
      cnic: string;
      password: string;
      societyId: string;
    },
  ) => Promise<AuthResponse>;
  changeAdminPassword: (token: string, userId: string, newPassword: string) => Promise<void>;
};

export function createApiClient(apiBase: string): ApiClient {
  async function request<T>(
    path: string,
    init: RequestInit,
    bearer?: string,
  ): Promise<T> {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `Request failed with status ${response.status}`;
      try {
        const json = JSON.parse(text) as { message?: string | string[] };
        if (json.message) {
          message = Array.isArray(json.message) ? json.message.join(", ") : json.message;
        }
      } catch {
        if (text) message = text;
      }
      throw new Error(message);
    }

    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type") ?? "";
    if (
      response.status === 204 ||
      contentLength === "0" ||
      !contentType.includes("application/json")
    ) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    login: (phone, password) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }),
    verifyEmail: (token) =>
      request<{ message: string }>(
        `/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
        },
      ),
    register: (payload) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: (token) => request<User>("/auth/me", { method: "GET" }, token),
    updateProfile: (token, payload) =>
      request<User>(
        "/auth/profile",
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        token,
      ),
    societies: (token) =>
      request<Society[]>("/societies", { method: "GET" }, token),
    society: (token, id) =>
      request<Society>(`/societies/${id}`, { method: "GET" }, token),
    residents: (token) =>
      request<Resident[]>("/residents", { method: "GET" }, token),
    houses: (token) =>
      request<House[]>("/houses", { method: "GET" }, token),
    billings: (token) =>
      request<Billing[]>("/billings", { method: "GET" }, token),
    complaints: (token) =>
      request<Complaint[]>("/complaints", { method: "GET" }, token),
    visitors: (token) =>
      request<VisitorLog[]>("/visitors", { method: "GET" }, token),
    createSociety: (token, payload) =>
      request<Society>(
        "/societies",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token,
      ),
    createSocietyAdmin: (token, payload) =>
      request<AuthResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            role: "SOCIETY_ADMIN",
          }),
        },
        token,
      ),
    createHouse: (token, payload) =>
      request<House>("/houses", { method: "POST", body: JSON.stringify(payload) }, token),
    updateHouse: (token, id, payload) =>
      request<House>(`/houses/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    updateHouseResidentCount: (token, id, residentCount) =>
      request<House>(
        `/houses/${id}/resident-count`,
        { method: "PATCH", body: JSON.stringify({ residentCount }) },
        token,
      ),
    createBilling: (token, payload) =>
      request<Billing>("/billings", { method: "POST", body: JSON.stringify(payload) }, token),
    updateBilling: (token, id, payload) =>
      request<Billing>(`/billings/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    createVisitor: (token, payload) =>
      request<VisitorLog>("/visitors", { method: "POST", body: JSON.stringify(payload) }, token),
    updateVisitor: (token, id, payload) =>
      request<VisitorLog>(`/visitors/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    updateComplaint: (token, id, payload) =>
      request<Complaint>(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    createComplaint: (token, payload) =>
      request<Complaint>("/complaints", { method: "POST", body: JSON.stringify(payload) }, token),
    createResident: (token, payload) =>
      request<AuthResponse>(
        "/auth/register",
        { method: "POST", body: JSON.stringify({ ...payload, role: "RESIDENT_OWNER" }) },
        token,
      ),
    changeAdminPassword: (token, userId, newPassword) =>
      request<void>(
        `/auth/users/${userId}/password`,
        { method: "PATCH", body: JSON.stringify({ newPassword }) },
        token,
      ),
  };
}
