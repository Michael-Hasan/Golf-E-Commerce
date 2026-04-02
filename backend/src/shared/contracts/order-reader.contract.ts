export const ORDER_READER = Symbol('ORDER_READER');

export type OrderLineItemView = {
  id: string;
  brand: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CheckoutOrderView = {
  orderNumber: string;
  placedAtIso: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  contactEmail: string;
  deliveryName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  items: OrderLineItemView[];
};

export type RecentOrderSummaryView = {
  orderNumber: string;
  orderDate: string;
  itemCount: number;
  status: string;
  totalAmount: number;
};

export interface OrderReader {
  getOrderByNumber(orderNumber: string): Promise<CheckoutOrderView | null>;
  getRecentOrdersForEmail(email: string): Promise<RecentOrderSummaryView[]>;
}
