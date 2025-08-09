import { OrderItem, Order, OrderItemWithDetails, Quote } from '../../domain/entities/order';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { DiscountEngine } from '../services/discount-engine';
import { QuoteRepository } from '../../domain/repositories/quote-repository';
import { v4 as uuidv4 } from 'uuid';

export class OrderUseCases {
    constructor(
        private productRepository: ProductRepository,
        private discountEngine: DiscountEngine,
        private quoteRepository: QuoteRepository
    ) {}

    private async processOrderItems(items: OrderItem[]): Promise<{ orderItemsWithDetails: OrderItemWithDetails[], productsMap: Map<string, any> }> {
        const orderItemsWithDetails: OrderItemWithDetails[] = [];
        const productsMap = new Map<string, any>();

        for (const item of items) {
            const product = this.productRepository.findById(item.productId);
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            productsMap.set(product.id, product);
            orderItemsWithDetails.push({
                ...item,
                unitPrice: product.unitPrice,
                subtotal: 0,
                itemDiscounts: [],
                total: 0
            });
        }
        return { orderItemsWithDetails, productsMap };
    }

    public async calculateOrder(items: OrderItem[]): Promise<Order> {
        const { orderItemsWithDetails, productsMap } = await this.processOrderItems(items);
        return this.discountEngine.calculateDiscounts(orderItemsWithDetails, productsMap);
    }

    public async createQuote(items: OrderItem[]): Promise<{ quoteId: string; order: Order }> {
        const order = await this.calculateOrder(items);
        const quoteId = uuidv4();
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 30);

        const quote: Quote = {
            id: quoteId,
            order: order,
            expiration: expiration
        };

        this.quoteRepository.save(quote);
        return { quoteId, order };
    }

    public async finalizeOrder(quoteId: string): Promise<Order> {
        const quote = this.quoteRepository.findById(quoteId);

        if (!quote) {
            throw new Error(`Invalid or expired quote with ID ${quoteId}. Please generate a new quote.`);
        }
        return quote.order;
    }
}