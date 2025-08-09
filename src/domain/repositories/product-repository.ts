import { Product } from '../entities/product';

export class ProductRepository {
    private products: Product[] = [
        { id: 'sku-001', name: 'Product A', unitPrice: 79.9, category: 'electronics' },
        { id: 'sku-002', name: 'Product B', unitPrice: 39.9, category: 'acessorios' },
        { id: 'sku-003', name: 'Product C', unitPrice: 19.9, category: 'books' },
        { id: 'sku-004', name: 'Product D', unitPrice: 1500.0, category: 'electronics' },
        { id: 'sku-005', name: 'Product E', unitPrice: 5.0, category: 'acessorios' }
    ];

    public findById(id: string): Product | undefined {
        return this.products.find(p => p.id === id);
    }
}