import { Quote } from '../entities/order';

export class QuoteRepository {
    private quotes = new Map<string, Quote>();

    public save(quote: Quote): void {
        this.quotes.set(quote.id, quote);
    }

    public findById(id: string): Quote | undefined {
        const quote = this.quotes.get(id);
        if (quote && quote.expiration > new Date()) {
            return quote;
        }
        if (quote && quote.expiration <= new Date()) {
            this.quotes.delete(id);
        }
        return undefined;
    }
}