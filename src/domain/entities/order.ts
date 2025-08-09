export interface OrderItem {
    productId: string;
    quantity: number;
}

export interface OrderItemWithDetails {
    productId: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    itemDiscounts: Discount[];
    total: number;
}

export interface Discount {
    code: string;
    name: string;
    basis: number;
    amount: number;
    metadata: Record<string, any>;
}

export interface Order {
    currency: string;
    items: OrderItemWithDetails[];
    discounts: Discount[];
    total: number;
}

export interface Quote {
    id: string;
    order: Order;
    expiration: Date;
}