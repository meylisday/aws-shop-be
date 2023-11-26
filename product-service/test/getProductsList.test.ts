import { handler } from '../src/handlers/getProductsList';
import { response } from "../src/utils";

describe('get product list', () => {
    test('get product list array', async () => {
        const result = await handler();
        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: expect.any(String),
                count: expect.any(Number),
                price: expect.any(Number),
                title: expect.any(String),
                description: expect.any(String),
            }),
        ]));
    })

    test('error', async () => {
        try {
            await handler();
        } catch (error) {
            expect(error).toEqual(response(500, { error: 'Internal Server Error' }));
        }
    })
})
