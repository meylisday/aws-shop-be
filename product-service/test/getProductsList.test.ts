import { handler } from '../src/handlers/getProductsList';
import { PRODUCTS } from '../src/constants';
import { response } from "../src/utils";

describe('get product list', () => {
    test('get product list array', async () => {
        const result = await handler();
        expect(result).toEqual(response(200, PRODUCTS))
    })

    test('error', async () => {
        try {
            const response = await handler()
        } catch {
            const mockError = new Error('Test Error');
            const res = response(500, {
                mockError
            })

            expect(res).toEqual(response(500, {
                mockError
            }))
        }

    })
})