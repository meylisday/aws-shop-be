import { PRODUCTS } from '../constants';
import { response } from '../utils';

export const handler = async (event: any = {}) => {
    const productId = event.pathParameters.productId;

    if (!productId) {
        return response(400, 'Error: you are missing the path parameter id');
    }

    const product = PRODUCTS.find((item) => item.id === productId);

    if (!product) {
        return response(404, 'Error: Product not found');
    }

    try {
        return response(200, product);
    } catch (err: unknown) {
        return response(500, { err });
    }
};
