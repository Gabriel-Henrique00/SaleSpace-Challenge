import { Router } from 'express';
import { OrderController } from '../controllers/order-controller';
import { OrderUseCases } from '../../application/use-cases/order-use-cases';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { DiscountEngine } from '../../application/services/discount-engine';
import { QuoteRepository } from '../../domain/repositories/quote-repository';

const router = Router();

const productRepository = new ProductRepository();
const discountEngine = new DiscountEngine();
const quoteRepository = new QuoteRepository();
const orderUseCases = new OrderUseCases(productRepository, discountEngine, quoteRepository);
const orderController = new OrderController(orderUseCases);

// Endpoint for creating a quote
router.post('/orders/quote', (req, res) => orderController.createQuote(req, res));

// Endpoint for finalizing an order with a quoteId
router.post('/orders', (req, res) => orderController.finalizeOrder(req, res));

// Endpoint for a simple order calculation (without quote)
router.post('/orders/calculate', (req, res) => orderController.calculateOrder(req, res));


export default router;