export enum ShipmentStatus {
  PENDING = 'PENDING',        // Chưa vận chuyển / Chờ lấy
  IN_TRANSIT = 'IN_TRANSIT',  // Đang vận chuyển
  DELIVERING = 'DELIVERING',  // Đang giao hàng (Shipper đang đi phát)
  DELIVERED = 'DELIVERED',    // Đã ký nhận
  EXCEPTION = 'EXCEPTION',    // Không giao được / Lỗi
  UNKNOWN = 'UNKNOWN',        // Không tìm thấy thông tin
}

export enum Carrier {
  SF_EXPRESS = 'SF Express (Thuận Phong)',
  DEBON = 'Debon (Đức Bang)',
  ZTO = 'ZTO Express',
  YTO = 'YTO Express',
  STO = 'STO Express',
  YUNDA = 'Yunda Express',
  EMS_CHINA = 'EMS China',
  BEST_EXPRESS = 'Best Express',
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  trackingCode: string;
  carrier: Carrier;
  status: ShipmentStatus;
  events: TrackingEvent[];
  lastUpdated: string;
  createdAt: string;
  // New fields for Real AI Tracking
  aiAnalysis?: string; // Tóm tắt tình trạng từ AI
  sourceLinks?: { title: string; url: string }[]; // Link nguồn tìm thấy
}

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}