import { handler } from '../src/handlers/getProductById';
import { PRODUCTS } from '../src/constants';
import { response } from "../src/utils";

describe('get product by id', () => {
    test('get product by id', async () => {
        const event = {
            pathParameters: { productId: '7e0e37dc-f426-4770-b412-e9fd523ba11d' }
        }

        const result = await handler(event);
        console.log(result);
        const productToFind = PRODUCTS.find(item => item.id === '7e0e37dc-f426-4770-b412-e9fd523ba11d')
        expect(result).toEqual(response(200, productToFind))
    })

    test('error no parameters', async () => {
        const event = {
            pathParameters: {}
        }
        const result = await handler(event);
        expect(result).toEqual(response(400, 'Error: Missing the path parameter productId'));
    })

    test('error', async () => {
        const event = {
            pathParameters: { productId: '1' },
        };

        try {
            const response = await handler(event)
        } catch {

            const mockError = new Error('Test Error');
            const result = response(500, { mockError })

            expect(result).toEqual(response(500, {
                mockError
            }))
        }
    })
})