import { PRODUCTS } from '../constants';
import { response } from '../utils'

export const handler = async () => {
    try {
        return response(200,
            PRODUCTS
        );
    } catch (err: unknown) {
        return response(500, {
            err
        })
    }
}