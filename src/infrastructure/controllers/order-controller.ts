import { Request, Response } from 'express';
import { OrderUseCases } from '../../application/use-cases/order-use-cases';

export class OrderController {
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

    public async calculateOrder(req: Request, res: Response): Promise<Response> {
        const { items } = req.body;
        const validationError = this.validateItemsPayload(items);
        if (validationError) {
            return res.status(422).json({ message: validationError });
        }

        try {
            const order = await this.orderUseCases.calculateOrder(items);
            return res.status(200).json(order);
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
            return res.status(201).json(quote);
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
            return res.status(200).json(order);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                return res.status(404).json({ message: error.message });
            }
            if (error instanceof Error && error.message.includes('expired')) {
                return res.status(422).json({ message: error.message });
            }
            console.error('Unexpected error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}