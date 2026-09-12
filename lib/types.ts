export type Role = "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT" | "PHARMACIST";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  branch: number | null;
  branch_name: string | null;
  phone: string;
  cnic: string;
  is_active_staff: boolean;
  date_joined: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  license_number: string;
  is_active: boolean;
  opened_on: string | null;
  staff_count: number;
}

export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  sku: string;
  barcode: string;
  category: number | null;
  category_name: string | null;
  manufacturer: number | null;
  manufacturer_name: string | null;
  unit_type: string;
  pack_size: string;
  requires_prescription: boolean;
  is_active: boolean;
  reorder_level: number;
  total_stock: number;
}

export interface Batch {
  id: number;
  medicine: number;
  medicine_name: string;
  branch: number;
  branch_name: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  cost_price: string;
  sale_price: string;
  expiry_date: string;
  received_date: string;
  is_active: boolean;
  stock_value: string;
  is_expired: boolean;
  is_near_expiry: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  total_payable: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  home_branch: number | null;
  home_branch_name: string | null;
  loyalty_points: number;
  is_active: boolean;
  lifetime_spend: string;
}

export interface Sale {
  id: number;
  branch: number;
  branch_name: string;
  invoice_number: string;
  customer: number | null;
  customer_name: string | null;
  cashier: number;
  cashier_name: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  status: string;
  note: string;
  items: SaleItem[];
  payments: SalePayment[];
  created_at: string;
}

export interface SaleItem {
  id: number;
  batch: number;
  medicine_name_snapshot: string;
  quantity: number;
  unit_price: string;
  unit_cost_snapshot: string;
  discount_amount: string;
  line_total: string;
  quantity_returned: number;
  profit: string;
}

export interface SalePayment {
  id: number;
  method: string;
  amount: string;
  bank_account: number | null;
  reference_number: string;
}

export interface CartLine {
  medicine_id: number;
  medicine_name: string;
  batch_id: number;
  available_qty: number;
  unit_price: number;
  quantity: number;
  discount_amount: number;
}

export interface OwnerDashboardSummary {
  net_sales: number;
  gross_profit: number;
  total_invoices: number;
  total_stock_value: number;
  total_bank_balance: number;
  total_supplier_dues: number;
  low_stock_items: number;
  expiring_soon_items: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
