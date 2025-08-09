import { Discount, Order, OrderItemWithDetails } from '../../domain/entities/order';
import { Product } from '../../domain/entities/product';

function roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export class DiscountEngine {
    private calculateItemSubtotal(item: OrderItemWithDetails): number {
        return roundToTwoDecimals(item.unitPrice * item.quantity);
    }

    private applyCategoryDiscount(
        item: OrderItemWithDetails,
        product: Product,
        categoryEligible: boolean
    ): Discount[] {
        const discounts: Discount[] = [];

        if (categoryEligible && product.category === 'acessorios') {
            const discountAmount = roundToTwoDecimals(item.subtotal * 0.05);
            discounts.push({
                code: 'CAT_ACC_5PCT',
                name: 'Categoria acessórios 5%',
                basis: item.subtotal,
                amount: discountAmount,
                metadata: {
                    category: 'acessorios',
                    threshold: 5
                }
            });
            item.total = roundToTwoDecimals(item.total - discountAmount);
        }

        return discounts;
    }

    private applyVolumeDiscount(totalItems: number, currentTotal: number): Discount | null {
        if (totalItems >= 50) {
            const amount = roundToTwoDecimals(currentTotal * 0.20);
            return {
                code: 'QTY_TIER_20PCT',
                name: 'Desconto por volume 20%',
                basis: currentTotal,
                amount,
                metadata: { totalItems, tier: '>=50' }
            };
        } else if (totalItems >= 20) {
            const amount = roundToTwoDecimals(currentTotal * 0.15);
            return {
                code: 'QTY_TIER_15PCT',
                name: 'Desconto por volume 15%',
                basis: currentTotal,
                amount,
                metadata: { totalItems, tier: '>=20' }
            };
        } else if (totalItems >= 10) {
            const amount = roundToTwoDecimals(currentTotal * 0.10);
            return {
                code: 'QTY_TIER_10PCT',
                name: 'Desconto por volume 10%',
                basis: currentTotal,
                amount,
                metadata: { totalItems, tier: '>=10' }
            };
        }
        return null;
    }

    private applyCartValueDiscount(originalSubtotal: number): Discount | null {
        if (originalSubtotal >= 2000) {
            return {
                code: 'CART_VALUE_FIXED_150',
                name: 'Desconto por valor do carrinho',
                basis: originalSubtotal,
                amount: 150.0,
                metadata: { threshold: 2000 }
            };
        } else if (originalSubtotal >= 1000) {
            return {
                code: 'CART_VALUE_FIXED_50',
                name: 'Desconto por valor do carrinho',
                basis: originalSubtotal,
                amount: 50.0,
                metadata: { threshold: 1000 }
            };
        }
        return null;
    }

    public calculateDiscounts(items: OrderItemWithDetails[], products: Map<string, Product>): Order {
        let totalItems = 0;
        let subtotalOriginal = 0;
        let total: number;
        let accessoriesUnits = 0;

        const allDiscounts: Discount[] = [];

        for (const item of items) {
            const product = products.get(item.productId);
            if (!product) continue;

            item.subtotal = this.calculateItemSubtotal(item);
            item.total = item.subtotal;
            item.itemDiscounts = item.itemDiscounts ?? [];

            subtotalOriginal = roundToTwoDecimals(subtotalOriginal + item.subtotal);
            totalItems += item.quantity;

            if (product.category === 'acessorios') {
                accessoriesUnits += item.quantity;
            }
        }

        //Regra 3
        const categoryEligible = accessoriesUnits > 5;

        if (categoryEligible) {
            for (const item of items) {
                const product = products.get(item.productId);
                if (!product) continue;

                const discounts = this.applyCategoryDiscount(item, product, categoryEligible);
                if (discounts.length > 0) {
                    item.itemDiscounts = [...(item.itemDiscounts || []), ...discounts];
                }
            }
        }

        total = 0;
        for (const item of items) {
            total = roundToTwoDecimals(total + item.total);
        }

        //Regra 1
        const volumeDiscount = this.applyVolumeDiscount(totalItems, total);
        if (volumeDiscount) {
            allDiscounts.push(volumeDiscount);
            total = roundToTwoDecimals(total - volumeDiscount.amount);
        }

        //Regra 2
        const cartValueDiscount = this.applyCartValueDiscount(subtotalOriginal);
        if (cartValueDiscount) {
            allDiscounts.push(cartValueDiscount);
            total = roundToTwoDecimals(total - cartValueDiscount.amount);
        }

        return {
            currency: 'BRL',
            items,
            discounts: allDiscounts,
            total
        };
    }
}