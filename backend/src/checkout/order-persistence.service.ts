import {
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceOrderInput } from './dto/place-order.input';
import { Order, OrderLineItem } from './entities/order.entity';

type CreateOrderPayload = {
  input: PlaceOrderInput;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  items: OrderLineItem[];
  userId?: string | null;
};

@Injectable()
export class OrderPersistenceService {
  private readonly inMemoryOrders: Order[] = [];

  constructor(
    @Optional()
    @InjectRepository(Order)
    private readonly orderRepository?: Repository<Order>,
  ) {}

  async saveOrder(payload: CreateOrderPayload): Promise<Order> {
    if (!this.orderRepository) {
      const now = new Date();
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber: payload.orderNumber,
        userId: payload.userId ?? null,
        subtotal: payload.subtotal,
        shippingCost: payload.shippingCost,
        tax: payload.tax,
        total: payload.total,
        currency: 'USD',
        paymentMethod: payload.input.paymentMethod,
        shippingMethod: payload.input.shippingMethod,
        contactEmail: payload.input.contactEmail,
        contactPhone: payload.input.contactPhone,
        deliveryName: payload.input.deliveryName,
        deliveryAddressLine1: payload.input.deliveryAddressLine1,
        deliveryAddressLine2: payload.input.deliveryAddressLine2,
        deliveryCity: payload.input.deliveryCity,
        deliveryRegion: payload.input.deliveryRegion,
        deliveryPostalCode: payload.input.deliveryPostalCode,
        deliveryCountry: payload.input.deliveryCountry,
        items: payload.items,
        createdAt: now,
        placedAtIso: now.toISOString(),
      };
      this.inMemoryOrders.unshift(order);
      if (this.inMemoryOrders.length > 250) {
        this.inMemoryOrders.length = 250;
      }
      return order;
    }

    const entity = this.orderRepository.create({
      orderNumber: payload.orderNumber,
      userId: payload.userId ?? null,
      subtotal: payload.subtotal,
      shippingCost: payload.shippingCost,
      tax: payload.tax,
      total: payload.total,
      currency: 'USD',
      paymentMethod: payload.input.paymentMethod,
      shippingMethod: payload.input.shippingMethod,
      contactEmail: payload.input.contactEmail,
      contactPhone: payload.input.contactPhone,
      deliveryName: payload.input.deliveryName,
      deliveryAddressLine1: payload.input.deliveryAddressLine1,
      deliveryAddressLine2: payload.input.deliveryAddressLine2,
      deliveryCity: payload.input.deliveryCity,
      deliveryRegion: payload.input.deliveryRegion,
      deliveryPostalCode: payload.input.deliveryPostalCode,
      deliveryCountry: payload.input.deliveryCountry,
      items: payload.items,
    });

    const saved = await this.orderRepository.save(entity);
    saved.placedAtIso = saved.createdAt.toISOString();
    return saved;
  }

  async findOrderByNumber(orderNumber: string): Promise<Order | null> {
    if (!this.orderRepository) {
      return this.inMemoryOrders.find((order) => order.orderNumber === orderNumber) ?? null;
    }

    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });

    if (!order) {
      return null;
    }

    order.placedAtIso = order.createdAt.toISOString();
    return order;
  }

  async findRecentOrdersByEmail(email: string): Promise<Order[]> {
    if (!this.orderRepository) {
      const normalizedEmail = email.trim().toLowerCase();
      return this.inMemoryOrders.filter(
        (order) => order.contactEmail.trim().toLowerCase() === normalizedEmail,
      );
    }

    const orders = await this.orderRepository.find({
      where: { contactEmail: email.trim().toLowerCase() },
      order: { createdAt: 'DESC' },
      take: 250,
    });

    return orders.map((order) => ({
      ...order,
      placedAtIso: order.createdAt.toISOString(),
    }));
  }
}
