import api from "@/lib/api-axios";

export type CheckoutMode = "REDIRECT" | "FREE_ENROLLED";

export interface CouponPricingResponse {
  courseId: number;
  couponCode: string | null;
  discountPercent: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  free: boolean;
}

export interface CreateCheckoutSessionRequest {
  courseId: number;
  couponCode?: string;
}

export interface CreateCheckoutSessionResponse {
  mode: CheckoutMode;
  checkoutUrl?: string;
  sessionId?: string;
  paymentId: number;
  enrollmentId?: number;
  pricing: CouponPricingResponse;
}

export interface PaymentResponse {
  id: number;
  courseId: number;
  courseTitle: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentGateway: string;
  transactionId?: string;
  couponCode?: string;
  checkoutSessionId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CheckoutSessionStatusResponse {
  sessionId: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentId: number;
  courseId: number;
}

export interface CreateCouponRequest {
  courseId: number;
  code?: string;
  discountPercent: number;
  usageLimit?: number;
  expiresAt?: string;
}

export interface CouponResponse {
  id: number;
  code: string;
  courseId: number;
  discountPercent: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdByUserId: number;
  createdAt: string;
}

export interface ValidateCouponRequest {
  courseId: number;
  couponCode: string;
}

export const paymentsBillingApi = {
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await api.post<CreateCheckoutSessionResponse>("/api/payments/checkout-sessions", request);
    return response.data;
  },

  /** Paymob hosted checkout for a course (card / wallet). */
  async createPaymobCheckout(request: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const response = await api.post<CreateCheckoutSessionResponse>("/api/payments/paymob/checkout", request);
    return response.data;
  },

  async getMyPayments(): Promise<PaymentResponse[]> {
    const response = await api.get<PaymentResponse[]>("/api/payments/me");
    return response.data;
  },

  async getCheckoutSessionStatus(sessionId: string): Promise<CheckoutSessionStatusResponse> {
    const response = await api.get<CheckoutSessionStatusResponse>(`/api/payments/checkout-sessions/${sessionId}`);
    return response.data;
  },

  async createCoupon(request: CreateCouponRequest): Promise<CouponResponse> {
    const response = await api.post<CouponResponse>("/api/coupons", request);
    return response.data;
  },

  async getCourseCoupons(courseId: number): Promise<CouponResponse[]> {
    const response = await api.get<CouponResponse[]>(`/api/coupons/course/${courseId}`);
    return response.data;
  },

  async deactivateCoupon(couponId: number): Promise<void> {
    await api.patch(`/api/coupons/${couponId}/deactivate`);
  },

  async deleteCoupon(couponId: number): Promise<void> {
    await api.delete(`/api/coupons/${couponId}`);
  },

  async validateCoupon(request: ValidateCouponRequest): Promise<CouponPricingResponse> {
    const response = await api.post<CouponPricingResponse>("/api/coupons/validate", request);
    return response.data;
  },
};
