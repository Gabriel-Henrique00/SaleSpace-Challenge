import { OrderController } from '../infrastructure/controllers/order-controller';
import { Order } from '../domain/entities/order';

jest.mock('../application/use-cases/order-use-cases');

describe('OrderController Unit Tests', () => {
    let orderController: OrderController;

    beforeEach(() => {
        orderController = new OrderController(null as any);
    });

    it('should format response with "Unknown Product" for a product not found in the repository', () => {
        const order: Order = {
            currency: 'BRL',
            items: [{
                productId: 'sku-que-foi-deletado',
                quantity: 1,
                unitPrice: 99.9,
                subtotal: 99.9,
                itemDiscounts: [],
                total: 99.9,
            }],
            discounts: [],
            total: 99.9,
        };

        const formattedResponse = (orderController as any).formatResponse(order);
        expect(formattedResponse.itemsSummary[0].name).toBe('Unknown Product');
    });
});