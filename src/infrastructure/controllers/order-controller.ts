import { Request, Response } from 'express';
import { OrderUseCases } from '../../application/use-cases/order-use-cases';
import { Order, Discount } from '../../domain/entities/order';
import { ProductRepository } from '../../domain/repositories/product-repository';

interface OrderSummary {
    currency: string;
    totalBeforeDiscounts: number;
    totalAfterDiscounts: number;
}

interface ItemsSummary {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    discountsApplied: string;
    finalPrice: number;
}

interface SimplifiedOrderResponse {
    orderSummary: OrderSummary;
    itemsSummary: ItemsSummary[];
    discountsDetail: Discount[];
}

export class OrderController {
    private productRepository = new ProductRepository();

    constructor(private orderUseCases: OrderUseCases) {}

    private validateItemsPayload(items: any): string | null {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return "Payload is invalid. 'items' array is required and must not be empty.";
        }

        for (const item of items) {
            if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
                return "Payload is invalid. Each item must have a valid 'productId' and a 'quantity' greater than 0.";
            }
        }
        return null;
    }

    private formatResponse(order: Order): SimplifiedOrderResponse {
        const totalBeforeDiscounts = order.items.reduce((sum, item) => sum + item.subtotal, 0);

        const itemsSummary = order.items.map(item => {
            const product = this.productRepository.findById(item.productId);
            const discountsApplied = item.itemDiscounts.length > 0
                ? item.itemDiscounts.map(d => `${d.name} (${d.amount.toFixed(2)})`).join(', ')
                : "Nenhum";
            return {
                productId: item.productId,
                name: product?.name || 'Unknown Product',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                discountsApplied: discountsApplied,
                finalPrice: item.total
            };
        });
        return {
            orderSummary: {
                currency: order.currency,
                totalBeforeDiscounts: totalBeforeDiscounts,
                totalAfterDiscounts: order.total
            },
            itemsSummary: itemsSummary,
            discountsDetail: order.discounts
        };
    }

    public async calculateOrder(req: Request, res: Response): Promise<Response> {
        const { items } = req.body;
        const validationError = this.validateItemsPayload(items);
        if (validationError) {
            return res.status(422).json({ message: validationError });
        }

        try {
            const order = await this.orderUseCases.calculateOrder(items);
            const formattedResponse = this.formatResponse(order);
            return res.status(200).json(formattedResponse);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return res.status(404).json({ message: error.message });
            }
            console.error('Unexpected error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    public async createQuote(req: Request, res: Response): Promise<Response> {
        const { items } = req.body;
        const validationError = this.validateItemsPayload(items);
        if (validationError) {
            return res.status(422).json({ message: validationError });
        }

        try {
            const quote = await this.orderUseCases.createQuote(items);
            const formattedResponse = {
                quoteId: quote.quoteId,
                ...this.formatResponse(quote.order)
            };
            return res.status(201).json(formattedResponse);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return res.status(404).json({ message: error.message });
            }
            console.error('Unexpected error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    public async finalizeOrder(req: Request, res: Response): Promise<Response> {
        const { quoteId } = req.body;

        if (!quoteId || typeof quoteId !== 'string') {
            return res.status(422).json({ message: "Payload is invalid. A 'quoteId' string is required." });
        }

        try {
            const order = await this.orderUseCases.finalizeOrder(quoteId);
            const formattedResponse = this.formatResponse(order);
            return res.status(200).json(formattedResponse);
        } catch (error) {
            if (error instanceof Error && (error.message.includes('expired') || error.message.includes('Invalid'))) {
                return res.status(422).json({ message: error.message });
            }

            console.error('Unexpected error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}