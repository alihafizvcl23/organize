import type { Booking, CallRecord, MenuItem, Order } from "@/lib/types";

type InsertRow<Row, Generated extends keyof Row> = Omit<Row, Generated> & Partial<Pick<Row, Generated>>;

export type Database = {
  public: {
    Tables: {
      menu_items: { Row: MenuItem; Insert: InsertRow<MenuItem, "id">; Update: Partial<MenuItem>; Relationships: [] };
      orders: { Row: Order; Insert: InsertRow<Order, "id" | "created_at">; Update: Partial<Order>; Relationships: [] };
      bookings: { Row: Booking; Insert: InsertRow<Booking, "id" | "created_at">; Update: Partial<Booking>; Relationships: [] };
      calls: { Row: CallRecord; Insert: InsertRow<CallRecord, "id" | "created_at" | "duration_s" | "summary" | "transcript" | "recording_url" | "sms_sent">; Update: Partial<CallRecord>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
