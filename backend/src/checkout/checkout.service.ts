import { BadRequestException, Injectable } from '@nestjs/common';
import { PlaceOrderInput } from './dto/place-order.input';
import { CheckoutOrderResult } from './models/order-result.model';

type RecentOrderSummary = {
  orderNumber: string;
  orderDate: string;
  itemCount: number;
  status: string;
  totalAmount: number;
};

@Injectable()
export class CheckoutService {
  private readonly orders: CheckoutOrderResult[] = [];

  placeOrder(input: PlaceOrderInput): CheckoutOrderResult {
    if (!input.items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = input.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const shippingCost = input.shippingMethod === 'EXPRESS' ? 14.99 : 0;
    const tax = Number((subtotal * 0.0825).toFixed(2));
    const total = Number((subtotal + shippingCost + tax).toFixed(2));
    const now = new Date();
    const orderNumber = `GL-${now.getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`;

    const order: CheckoutOrderResult = {
      orderNumber,
      placedAtIso: now.toISOString(),
      subtotal: Number(subtotal.toFixed(2)),
      shippingCost,
      tax,
      total,
      currency: 'USD',
      paymentMethod: input.paymentMethod,
      shippingMethod: input.shippingMethod,
      contactEmail: input.contactEmail,
      deliveryName: input.deliveryName,
      deliveryAddressLine1: input.deliveryAddressLine1,
      deliveryAddressLine2: input.deliveryAddressLine2,
      deliveryCity: input.deliveryCity,
      deliveryRegion: input.deliveryRegion,
      deliveryPostalCode: input.deliveryPostalCode,
      deliveryCountry: input.deliveryCountry,
      items: input.items.map((item) => ({
        id: item.id,
        brand: item.brand,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
      })),
    };

    this.orders.unshift(order);
    if (this.orders.length > 250) {
      this.orders.length = 250;
    }
    return order;
  }

  getOrderByNumber(orderNumber: string): CheckoutOrderResult | null {
    return this.orders.find((item) => item.orderNumber === orderNumber) ?? null;
  }

  getRecentOrdersForEmail(email: string): RecentOrderSummary[] {
    const normalizedEmail = email.trim().toLowerCase();

    return this.orders
      .filter(
        (order) => order.contactEmail.trim().toLowerCase() === normalizedEmail,
      )
      .map((order) => ({
        orderNumber: order.orderNumber,
        orderDate: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(order.placedAtIso)),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        status: 'Processing',
        totalAmount: order.total,
      }));
  }
}
