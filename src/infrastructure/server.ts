import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import orderRoutes from './routes/order-routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Swagger setup
const swaggerDocument = YAML.load(path.resolve(__dirname, '../../src/docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/v1', orderRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});