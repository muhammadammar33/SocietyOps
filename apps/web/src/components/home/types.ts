export type User = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phone: string;
  cnic: string;
  name: string;
  role: string;
  societyId: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Society = {
  id: string;
  name: string;
  location: string;
  createdAt?: string;
};

export type Resident = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cnic: string;
  role: string;
  societyId: string | null;
};

export type House = {
  id: string;
  societyId: string;
  type: "HOUSE" | "PLOT";
  block: string;
  houseNumber: string;
  ownerId: string | null;
  residentCount: number;
  status: "OCCUPIED" | "VACANT" | "FOR_SALE" | "FOR_RENT";
  createdAt: string;
};

export type Billing = {
  id: string;
  houseId: string;
  description: string;
  amount: string;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  createdAt: string;
};

export type Complaint = {
  id: string;
  houseId: string;
  userId: string;
  description: string;
  category: "ISSUE" | "QUERY";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
};

export type VisitorLog = {
  id: string;
  houseId: string;
  visitorName: string;
  entryTime: string;
  exitTime: string | null;
  createdAt: string;
};

export type LoginPayload = {
  phone: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  cnic: string;
  password: string;
};

export type CreateSocietyPayload = {
  name: string;
  location: string;
};

export type CreateSocietyAdminPayload = {
  name: string;
  email: string;
  phone: string;
  cnic: string;
  password: string;
  societyId: string;
};

