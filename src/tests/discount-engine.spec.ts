import { DiscountEngine } from '../application/services/discount-engine';
import { OrderItem, OrderItemWithDetails } from '../domain/entities/order';
import { Product } from '../domain/entities/product';
import { ProductRepository } from '../domain/repositories/product-repository';

// Mock do ProductRepository
class MockProductRepository extends ProductRepository {
    public findById(id: string): Product | undefined {
        const products: Product[] = [
            { id: 'sku-001', name: 'Product A', unitPrice: 79.9, category: 'electronics' },
            { id: 'sku-002', name: 'Product B', unitPrice: 39.9, category: 'acessorios' },
            { id: 'sku-003', name: 'Product C', unitPrice: 19.9, category: 'acessorios' },
            { id: 'sku-004', name: 'Product D', unitPrice: 1500.0, category: 'electronics' },
            { id: 'sku-005', name: 'Product E', unitPrice: 5.0, category: 'acessorios' }
        ];
        return products.find(p => p.id === id);
    }
}

describe('DiscountEngine', () => {
    let discountEngine: DiscountEngine;
    let productsMap: Map<string, Product>;
    let mockProductRepository: MockProductRepository;

    beforeEach(() => {
        mockProductRepository = new MockProductRepository();
        discountEngine = new DiscountEngine();
        productsMap = new Map();
        mockProductRepository.findById('sku-001') && productsMap.set('sku-001', mockProductRepository.findById('sku-001')!);
        mockProductRepository.findById('sku-002') && productsMap.set('sku-002', mockProductRepository.findById('sku-002')!);
        mockProductRepository.findById('sku-003') && productsMap.set('sku-003', mockProductRepository.findById('sku-003')!);
        mockProductRepository.findById('sku-004') && productsMap.set('sku-004', mockProductRepository.findById('sku-004')!);
        mockProductRepository.findById('sku-005') && productsMap.set('sku-005', mockProductRepository.findById('sku-005')!);
    });

    const getOrderItemsWithDetails = (items: OrderItem[]): OrderItemWithDetails[] => {
        return items.map(item => {
            const product = productsMap.get(item.productId);
            if (!product) throw new Error('Product not found in mock map');
            return {
                ...item,
                unitPrice: product.unitPrice,
                subtotal: Math.round(item.quantity * product.unitPrice * 100) / 100,
                itemDiscounts: [],
                total: Math.round(item.quantity * product.unitPrice * 100) / 100
            };
        });
    };

    test('should return order without any discounts if no rules are met', () => {
        // Garante que nenhum desconto seja aplicado se nenhuma regra for atendida.
        const items: OrderItem[] = [
            { productId: 'sku-001', quantity: 1 },
            { productId: 'sku-002', quantity: 1 },
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);
        expect(order.discounts).toHaveLength(0);
        expect(order.total).toBe(119.8);
    });

    test('should apply 10% volume discount and R$150 cart value discount when applicable', () => {
        // Testa a aplicação combinada do desconto de 10% por volume e R$150 por valor.
        const items: OrderItem[] = [
            { productId: 'sku-001', quantity: 5 },
            { productId: 'sku-004', quantity: 5 },
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);

        const subtotalOriginal = 5 * 79.9 + 5 * 1500.0;
        const volumeDiscountAmount = Math.round(subtotalOriginal * 0.10 * 100) / 100;
        const cartValueDiscountAmount = 150.0;
        const finalTotal = subtotalOriginal - volumeDiscountAmount - cartValueDiscountAmount;

        expect(order.discounts).toHaveLength(2);
        expect(order.discounts.some(d => d.code === 'QTY_TIER_10PCT')).toBeTruthy();
        expect(order.discounts.some(d => d.code === 'CART_VALUE_FIXED_150')).toBeTruthy();
        expect(order.total).toBe(Math.round(finalTotal * 100) / 100);
    });

    test('should apply 15% volume discount and R$150 cart value discount when applicable', () => {
        // Testa a aplicação combinada do desconto de 15% por volume e R$150 por valor.
        const items: OrderItem[] = [
            { productId: 'sku-001', quantity: 10 },
            { productId: 'sku-004', quantity: 10 },
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);

        const subtotalOriginal = 10 * 79.9 + 10 * 1500.0;
        const volumeDiscountAmount = Math.round(subtotalOriginal * 0.15 * 100) / 100;
        const cartValueDiscountAmount = 150.0;
        const finalTotal = subtotalOriginal - volumeDiscountAmount - cartValueDiscountAmount;

        expect(order.discounts).toHaveLength(2);
        expect(order.discounts.some(d => d.code === 'QTY_TIER_15PCT')).toBeTruthy();
        expect(order.discounts.some(d => d.code === 'CART_VALUE_FIXED_150')).toBeTruthy();
        expect(order.total).toBe(Math.round(finalTotal * 100) / 100);
    });

    test('should apply 20% volume discount and R$150 cart value discount when applicable', () => {
        // Testa a aplicação combinada do desconto de 20% por volume e R$150 por valor.
        const items: OrderItem[] = [
            { productId: 'sku-001', quantity: 25 },
            { productId: 'sku-004', quantity: 25 },
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);

        const subtotalOriginal = 25 * 79.9 + 25 * 1500.0;
        const volumeDiscountAmount = Math.round(subtotalOriginal * 0.20 * 100) / 100;
        const cartValueDiscountAmount = 150.0;
        const finalTotal = subtotalOriginal - volumeDiscountAmount - cartValueDiscountAmount;

        expect(order.discounts).toHaveLength(2);
        expect(order.discounts.some(d => d.code === 'QTY_TIER_20PCT')).toBeTruthy();
        expect(order.discounts.some(d => d.code === 'CART_VALUE_FIXED_150')).toBeTruthy();
        expect(order.total).toBe(Math.round(finalTotal * 100) / 100);
    });

    test('should apply fixed R$50 discount for cart value >= 1000 BRL', () => {
        // Verifica se o desconto fixo de R$50 é aplicado para carrinhos acima de R$1000.
        const items: OrderItem[] = [
            { productId: 'sku-004', quantity: 1 }
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);
        const totalWithoutDiscount = 1500.0;
        expect(order.discounts).toHaveLength(1);
        expect(order.discounts[0].code).toBe('CART_VALUE_FIXED_50');
        expect(order.discounts[0].amount).toBe(50.0);
        expect(order.total).toBe(totalWithoutDiscount - 50.0);
    });

    test('should apply fixed R$150 discount for cart value >= 2000 BRL', () => {
        // Verifica se o desconto fixo de R$150 é aplicado para carrinhos acima de R$2000.
        const items: OrderItem[] = [
            { productId: 'sku-004', quantity: 2 }
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);
        const totalWithoutDiscount = 2 * 1500.0;
        expect(order.discounts).toHaveLength(1);
        expect(order.discounts[0].code).toBe('CART_VALUE_FIXED_150');
        expect(order.discounts[0].amount).toBe(150.0);
        expect(order.total).toBe(totalWithoutDiscount - 150.0);
    });

    test('should apply 5% category discount per item for accessories if more than 5 accessory items in total', () => {
        // Valida o desconto de 5% por item para a categoria "acessorios" quando a quantidade mínima é atingida.
        const items: OrderItem[] = [
            { productId: 'sku-002', quantity: 3 },
            { productId: 'sku-003', quantity: 3 },
            { productId: 'sku-001', quantity: 1 },
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);

        const subtotalElectronics = 79.9;
        const item1_subtotal = 3 * 39.9;
        const item1_discount = Math.round(item1_subtotal * 0.05 * 100) / 100;
        const item2_subtotal = 3 * 19.9;
        const item2_discount = Math.round(item2_subtotal * 0.05 * 100) / 100;

        const totalWithItemDiscounts = (item1_subtotal - item1_discount) + (item2_subtotal - item2_discount) + subtotalElectronics;

        expect(order.discounts).toHaveLength(0);
        expect(order.items[0].itemDiscounts[0].code).toBe('CAT_ACC_5PCT');
        expect(order.items[0].total).toBe(Math.round((item1_subtotal - item1_discount) * 100) / 100);
        expect(order.items[1].itemDiscounts[0].code).toBe('CAT_ACC_5PCT');
        expect(order.items[1].total).toBe(Math.round((item2_subtotal - item2_discount) * 100) / 100);
        expect(order.total).toBe(Math.round(totalWithItemDiscounts * 100) / 100);
    });

    test('should apply 10% volume and R$150 cart value discounts when both criteria are met', () => {
        // Garante que os descontos de volume e valor do carrinho corretos sejam aplicados juntos.
        const items: OrderItem[] = [
            { productId: 'sku-004', quantity: 1 },
            { productId: 'sku-001', quantity: 15 }
        ];
        const itemsWithDetails = getOrderItemsWithDetails(items);
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);

        const subtotalOriginal = 1500.0 + (15 * 79.9);
        const volumeDiscountAmount = Math.round(subtotalOriginal * 0.10 * 100) / 100;
        const cartValueDiscountAmount = 150.0;
        const totalAfterDiscounts = subtotalOriginal - volumeDiscountAmount - cartValueDiscountAmount;

        expect(order.discounts).toHaveLength(2);
        expect(order.discounts.some(d => d.code === 'QTY_TIER_10PCT')).toBeTruthy();
        expect(order.discounts.some(d => d.code === 'CART_VALUE_FIXED_150')).toBeTruthy();
        expect(order.total).toBe(Math.round(totalAfterDiscounts * 100) / 100);
    });

    test('should gracefully handle items with non-existent products in the first loop and initialize itemDiscounts', () => {
        // Assegura que o sistema lide corretamente com produtos inexistentes, ignorando-os no cálculo.
        const itemsWithDetails: OrderItemWithDetails[] = [
            { productId: 'sku-001', quantity: 1, unitPrice: 79.9, subtotal: 0, itemDiscounts: [], total: 0 },
            { productId: 'non-existent', quantity: 1, unitPrice: 0, subtotal: 0, itemDiscounts: [], total: 0 }
        ];

        const incompleteProductsMap = new Map<string, Product>();
        incompleteProductsMap.set('sku-001', productsMap.get('sku-001')!);

        const order = discountEngine.calculateDiscounts(itemsWithDetails, incompleteProductsMap);

        expect(order.items).toHaveLength(1);
        expect(order.items[0].productId).toBe('sku-001');
        expect(order.items[0].itemDiscounts).toEqual([]);
        expect(order.total).toBe(79.90);
    });

    test('should handle non-existent products inside category discount loop', () => {
        // Valida o cálculo de desconto por categoria, garantindo que o arredondamento por item esteja correto.
        const itemsWithDetails: OrderItemWithDetails[] = [
            { productId: 'sku-002', quantity: 3, unitPrice: 39.9, subtotal: 119.7, itemDiscounts: [], total: 119.7 },
            { productId: 'sku-003', quantity: 3, unitPrice: 19.9, subtotal: 59.7, itemDiscounts: [], total: 59.7 },
            { productId: 'non-existent', quantity: 1, unitPrice: 0, subtotal: 0, itemDiscounts: [], total: 0 }
        ];

        const incompleteProductsMap = new Map<string, Product>(productsMap);
        incompleteProductsMap.delete('non-existent');

        const order = discountEngine.calculateDiscounts(itemsWithDetails, incompleteProductsMap);

        expect(order.items).toHaveLength(2);

        const round = (num: number) => Math.round(num * 100) / 100;
        const subtotal1 = 119.7;
        const subtotal2 = 59.7;
        const discount1 = round(subtotal1 * 0.05);
        const discount2 = round(subtotal2 * 0.05);
        const totalItem1 = subtotal1 - discount1;
        const totalItem2 = subtotal2 - discount2;
        const expectedTotal = round(totalItem1 + totalItem2);

        expect(order.total).toBeCloseTo(expectedTotal);
    });

    test('should initialize itemDiscounts as an empty array if it is undefined', () => {
        // Garante que a propriedade 'itemDiscounts' seja inicializada como um array vazio se ela for 'undefined'.
        const itemsWithDetails: OrderItemWithDetails[] = [
            {
                productId: 'sku-001',
                quantity: 1,
                unitPrice: 79.9,
                subtotal: 0,
                total: 0,
                itemDiscounts: undefined as any // Forçar `undefined`
            }
        ];
        const order = discountEngine.calculateDiscounts(itemsWithDetails, productsMap);
        expect(order.items).toHaveLength(1);
        expect(order.items[0].itemDiscounts).toEqual([]);
    });
});