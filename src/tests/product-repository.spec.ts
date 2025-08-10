import { ProductRepository } from '../domain/repositories/product-repository';

describe('ProductRepository', () => {
    let productRepository: ProductRepository;

    beforeEach(() => {
        productRepository = new ProductRepository();
    });

    test('should find a product by its ID', () => {
        const product = productRepository.findById('sku-001');
        expect(product).toBeDefined();
        expect(product?.id).toBe('sku-001');
        expect(product?.name).toBe('Product A');
    });

    test('should return undefined if a product ID is not found', () => {
        const product = productRepository.findById('non-existent-sku');
        expect(product).toBeUndefined();
    });
});