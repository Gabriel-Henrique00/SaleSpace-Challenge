import { Discount, OrderItemWithDetails, Order } from '../../domain/entities/order';
import { Product } from '../../domain/entities/product';

function roundToTwoDecimals(num: number): number {
    return Math.round(num * 100) / 100;
}

export class DiscountEngine {
    private calculateItemSubtotal(item: OrderItemWithDetails): number {
        return roundToTwoDecimals(item.unitPrice * item.quantity);
    }

    private applyCategoryDiscount(item: OrderItemWithDetails, product: Product): Discount[] {
        const discounts: Discount[] = [];
        if (product.category === 'acessorios' && item.quantity > 5) {
            const discountAmount = roundToTwoDecimals(item.subtotal * 0.05);
            discounts.push({
                code: "CAT_ACC_5PCT",
                name: "Categoria acessórios 5%",
                basis: item.subtotal,
                amount: discountAmount,
                metadata: {
                    category: "acessorios",
                    threshold: 5
                }
            });
            item.total = roundToTwoDecimals(item.total - discountAmount);
        }
        return discounts;
    }

    private applyVolumeDiscount(totalItems: number, currentTotal: number): Discount | null {
        if (totalItems >= 50) {
            const discountAmount = roundToTwoDecimals(currentTotal * 0.20);
            return {
                code: "QTY_TIER_20PCT",
                name: "Desconto por volume 20%",
                basis: currentTotal,
                amount: discountAmount,
                metadata: {
                    totalItems: totalItems,
                    tier: ">=50"
                }
            };
        } else if (totalItems >= 20) {
            const discountAmount = roundToTwoDecimals(currentTotal * 0.15);
            return {
                code: "QTY_TIER_15PCT",
                name: "Desconto por volume 15%",
                basis: currentTotal,
                amount: discountAmount,
                metadata: {
                    totalItems: totalItems,
                    tier: ">=20"
                }
            };
        } else if (totalItems >= 10) {
            const discountAmount = roundToTwoDecimals(currentTotal * 0.10);
            return {
                code: "QTY_TIER_10PCT",
                name: "Desconto por volume 10%",
                basis: currentTotal,
                amount: discountAmount,
                metadata: {
                    totalItems: totalItems,
                    tier: ">=10"
                }
            };
        }
        return null;
    }

    private applyCartValueDiscount(currentTotal: number): Discount | null {
        if (currentTotal >= 2000) {
            return {
                code: "CART_VALUE_FIXED_150",
                name: "Desconto por valor do carrinho",
                basis: currentTotal,
                amount: 150.00,
                metadata: {
                    threshold: 2000
                }
            };
        } else if (currentTotal >= 1000) {
            return {
                code: "CART_VALUE_FIXED_50",
                name: "Desconto por valor do carrinho",
                basis: currentTotal,
                amount: 50.00,
                metadata: {
                    threshold: 1000
                }
            };
        }
        return null;
    }

    public calculateDiscounts(items: OrderItemWithDetails[], products: Map<string, Product>): Order {
        let totalItems = 0;
        let total = 0;
        const allDiscounts: Discount[] = [];

        //Calculate subtotal and apply per-item discounts (Regra 3)
        for (const item of items) {
            const product = products.get(item.productId);
            if (!product) {
                continue;
            }

            item.subtotal = this.calculateItemSubtotal(item);
            item.total = item.subtotal;

            const categoryDiscounts = this.applyCategoryDiscount(item, product);
            item.itemDiscounts = categoryDiscounts;

            totalItems += item.quantity;
            total += item.total;
        }

        total = roundToTwoDecimals(total);

        //Apply volume discount (Regra 1)
        const volumeDiscount = this.applyVolumeDiscount(totalItems, total);
        if (volumeDiscount) {
            allDiscounts.push(volumeDiscount);
            total = roundToTwoDecimals(total - volumeDiscount.amount);
        }

        //Apply cart value discount (Regra 2)
        const cartValueDiscount = this.applyCartValueDiscount(total);
        if (cartValueDiscount) {
            allDiscounts.push(cartValueDiscount);
            total = roundToTwoDecimals(total - cartValueDiscount.amount);
        }

        return {
            currency: "BRL",
            items: items,
            discounts: allDiscounts,
            total: total
        };
    }
}