export type OrderStatus = "new" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderType = "pickup" | "delivery";
export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  available: boolean;
}

export type OrderLine = {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export type Order = {
  id: string;
  call_id: string | null;
  customer_name: string | null;
  phone: string;
  type: OrderType;
  address: string | null;
  items: OrderLine[];
  total: number;
  eta_minutes: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

export type Booking = {
  id: string;
  call_id: string | null;
  customer_name: string;
  phone: string;
  date: string;
  time: string;
  party_size: number;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
}

export type CallRecord = {
  id: string;
  call_id: string;
  phone: string;
  duration_s: number | null;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  sms_sent: boolean;
  created_at: string;
}
