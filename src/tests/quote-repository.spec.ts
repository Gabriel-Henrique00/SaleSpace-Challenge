import { QuoteRepository } from '../domain/repositories/quote-repository';
import { Quote } from '../domain/entities/order';
import { v4 as uuidv4 } from 'uuid';

jest.useFakeTimers();

describe('QuoteRepository', () => {
    let quoteRepository: QuoteRepository;

    beforeEach(() => {
        quoteRepository = new QuoteRepository();
    });

    it('should save and find a valid quote', () => {
        const quote: Quote = {
            id: uuidv4(),
            order: {} as any,
            expiration: new Date(new Date().getTime() + 30 * 60000)
        };
        quoteRepository.save(quote);
        const foundQuote = quoteRepository.findById(quote.id);
        expect(foundQuote).toBeDefined();
        expect(foundQuote?.id).toBe(quote.id);
    });

    it('should return undefined for a non-existent quote', () => {
        const foundQuote = quoteRepository.findById('non-existent-id');
        expect(foundQuote).toBeUndefined();
    });

    it('should return undefined and delete a quote after it expires', () => {
        const quoteId = uuidv4();
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 30);

        const quote: Quote = { id: quoteId, order: {} as any, expiration: expirationDate };
        quoteRepository.save(quote);

        let foundQuote = quoteRepository.findById(quoteId);
        expect(foundQuote).toBeDefined();

        jest.advanceTimersByTime(31 * 60 * 1000);

        foundQuote = quoteRepository.findById(quoteId);
        expect(foundQuote).toBeUndefined();
        expect((quoteRepository as any).quotes.has(quoteId)).toBe(false);
    });
});