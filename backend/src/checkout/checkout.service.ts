import { BadRequestException, Injectable } from '@nestjs/common';
import { PlaceOrderInput } from './dto/place-order.input';
import { RecentOrderSummary } from './entities/recent-order-summary.entity';
import { OrderReader } from '../shared/contracts/order-reader.contract';
import { AppLogger } from '../logging/logger.service';
import { JobsQueueService } from '../jobs/jobs-queue.service';
import { Order, OrderLineItem } from './entities/order.entity';
import { OrderPersistenceService } from './order-persistence.service';

@Injectable()
export class CheckoutService implements OrderReader {
  private readonly logger: AppLogger;

  constructor(
    private readonly orderPersistence: OrderPersistenceService,
    private readonly jobsQueue: JobsQueueService,
    logger: AppLogger,
  ) {
    this.logger = logger.withContext(CheckoutService.name);
  }

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    if (!input.items?.length) {
      this.logger.warn('Checkout rejected empty cart', {
        deliveryCountry: input.deliveryCountry,
      });
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

    const items: OrderLineItem[] = input.items.map((item) => ({
        id: item.id,
        brand: item.brand,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
      }));

    const order = await this.orderPersistence.saveOrder({
      input,
      orderNumber,
      subtotal: Number(subtotal.toFixed(2)),
      shippingCost,
      tax,
      total,
      items,
    });

    await this.jobsQueue.enqueue('orders.process', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      contactEmail: order.contactEmail,
    });

    this.logger.log('Order placed', {
      orderNumber: order.orderNumber,
      itemCount: order.items.length,
      total: order.total,
      shippingMethod: order.shippingMethod,
    });

    return order;
  }

  getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.orderPersistence.findOrderByNumber(orderNumber);
  }

  async getRecentOrdersForEmail(email: string): Promise<RecentOrderSummary[]> {
    const orders = await this.orderPersistence.findRecentOrdersByEmail(email);

    return orders
      .map((order) => ({
        orderNumber: order.orderNumber,
        orderDate: new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(order.createdAt),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        status: 'Processing',
        totalAmount: order.total,
      }));
  }
}
