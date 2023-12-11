import { handler } from '../src/handlers/catalogBatchProcess';
import { createProduct } from '../src/db/products';

jest.mock('../src/db/products');
jest.mock('../src/libs/sns', () => ({
    send: (command:any) => command,
}));

const PRODUCT_MOCK = {
    description: 'Test product',
    price: 100,
    title: 'Test title',
    count: 10,
};

describe('catalogBatch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return result', async () => {
        (createProduct as jest.Mock).mockReturnValueOnce(Promise.resolve(PRODUCT_MOCK));
        const response = await handler( { Records: [{ body: JSON.stringify(PRODUCT_MOCK) }] });
        expect(response.statusCode).toBe(200);
    });

    it('should return error', async () => {
        (createProduct as jest.Mock).mockReturnValueOnce(Promise.reject('Error'));
        const response = await handler( { Records: [{ body: JSON.stringify(PRODUCT_MOCK) }] });
        expect(response.statusCode).toBe(500);
    });
});