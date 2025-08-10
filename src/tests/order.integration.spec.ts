import request from 'supertest';
import express from 'express';
import orderRoutes from '../infrastructure/routes/order-routes';
import { OrderUseCases } from '../application/use-cases/order-use-cases';

const app = express();
app.use(express.json());
app.use('/v1', orderRoutes);

jest.useFakeTimers();

describe('Order API - Integration Tests', () => {

    describe('POST /v1/orders/calculate', () => {
        it('should return 200 and calculate an order with combined discounts correctly', async () => {
            const payload = {
                items: [
                    { productId: 'sku-004', quantity: 1 },
                    { productId: 'sku-001', quantity: 15 }
                ]
            };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(200);
            expect(response.body.orderSummary.totalAfterDiscounts).toBe(2278.65);
            expect(response.body.discountsDetail.length).toBe(2);
            expect(response.body.discountsDetail.some((d: { code: string; }) => d.code === 'QTY_TIER_10PCT')).toBeTruthy();
            expect(response.body.discountsDetail.some((d: { code: string; }) => d.code === 'CART_VALUE_FIXED_150')).toBeTruthy();
        });

        it('should return 200 and format item-level discounts correctly', async () => {
            const payload = { items: [{ productId: 'sku-002', quantity: 3 }, { productId: 'sku-003', quantity: 3 }] };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(200);
            const itemWithDiscount = response.body.itemsSummary.find((item: { productId: string; }) => item.productId === 'sku-002');
            expect(itemWithDiscount.discountsApplied).toContain('Categoria acessórios 5%');
        });

        it('should return 422 for an invalid payload (missing items)', async () => {
            const response = await request(app).post('/v1/orders/calculate').send({});
            expect(response.status).toBe(422);
            expect(response.body.message).toContain("'items' array is required");
        });

        it('should return 422 if an item has a quantity of 0', async () => {
            const payload = { items: [{ productId: 'sku-001', quantity: 0 }] };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(422);
            expect(response.body.message).toContain("quantity' greater than 0");
        });

        it('should return 422 if an item is missing a productId', async () => {
            const payload = { items: [{ quantity: 1 }] };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(422);
            expect(response.body.message).toContain("valid 'productId'");
        });

        it('should return 404 when a product is not found', async () => {
            const payload = { items: [{ productId: 'non-existent-sku', quantity: 1 }] };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });

        it('should return 500 for an unexpected error during calculation', async () => {
            const spy = jest.spyOn(OrderUseCases.prototype, 'calculateOrder').mockImplementationOnce(() => { throw new Error('Database connection lost'); });
            const payload = { items: [{ productId: 'sku-001', quantity: 1 }] };
            const response = await request(app).post('/v1/orders/calculate').send(payload);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal server error');
            spy.mockRestore();
        });
    });

    describe('POST /v1/orders/quote and POST /v1/orders', () => {
        let validQuoteId: string;

        it('should return 201 and create a quote successfully', async () => {
            const payload = { items: [{ productId: 'sku-001', quantity: 5 }] };
            const response = await request(app).post('/v1/orders/quote').send(payload);
            expect(response.status).toBe(201);
            expect(response.body.quoteId).toBeDefined();
            validQuoteId = response.body.quoteId;
        });

        it('should return 422 on quote creation for an invalid payload', async () => {
            const payload = { items: [] }; // Payload inválido com array de itens vazio
            const response = await request(app).post('/v1/orders/quote').send(payload);
            expect(response.status).toBe(422);
            expect(response.body.message).toContain("'items' array is required and must not be empty");
        });

        it('should return 404 on quote creation if a product is not found', async () => {
            const payload = { items: [{ productId: 'non-existent-sku', quantity: 1 }] };
            const response = await request(app).post('/v1/orders/quote').send(payload);
            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });

        it('should return 500 for an unexpected error during quote creation', async () => {
            const spy = jest.spyOn(OrderUseCases.prototype, 'createQuote').mockImplementationOnce(() => { throw new Error('Cache system failed'); });
            const payload = { items: [{ productId: 'sku-001', quantity: 1 }] };
            const response = await request(app).post('/v1/orders/quote').send(payload);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal server error');
            spy.mockRestore();
        });

        it('should return 200 and finalize the order using a valid quoteId', async () => {
            const response = await request(app).post('/v1/orders').send({ quoteId: validQuoteId });
            expect(response.status).toBe(200);
        });

        it('should return 422 when quoteId is not a string', async () => {
            const response = await request(app).post('/v1/orders').send({ quoteId: 12345 });
            expect(response.status).toBe(422);
            expect(response.body.message).toContain("A 'quoteId' string is required");
        });

        it('should return 422 when quote is expired', async () => {
            const payload = { items: [{ productId: 'sku-001', quantity: 1 }] };
            const quoteResponse = await request(app).post('/v1/orders/quote').send(payload);
            const expiredQuoteId = quoteResponse.body.quoteId;
            jest.advanceTimersByTime(31 * 60 * 1000);
            const finalizeResponse = await request(app).post('/v1/orders').send({ quoteId: expiredQuoteId });
            expect(finalizeResponse.status).toBe(422);
            expect(finalizeResponse.body.message).toContain('Invalid or expired quote');
        });

        it('should return 500 for an unexpected error during order finalization', async () => {
            const spy = jest.spyOn(OrderUseCases.prototype, 'finalizeOrder').mockImplementationOnce(() => { throw new Error('Quote repository connection failed'); });
            const response = await request(app).post('/v1/orders').send({ quoteId: 'any-valid-id' });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Internal server error');
            spy.mockRestore();
        });
    });
});