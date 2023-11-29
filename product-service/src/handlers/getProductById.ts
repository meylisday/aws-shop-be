import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyResult } from 'aws-lambda';
import { response } from '../utils';

const dynamoDB = new DynamoDB.DocumentClient({ region: 'us-east-1' });

export const handler = async (event: any = {}): Promise<APIGatewayProxyResult> => {
    
    console.log("Incoming request:", event);

    try {
        const productId = event.pathParameters?.productId;

        if (!productId) {
            return response(400, 'Error: Missing the path parameter productId');
        }

        const params = {
            TableName: process.env.PRODUCTS_TABLE as string,
            Key: {
                id: productId,
            },
        };

        const result = await dynamoDB.get(params).promise();

        if (!result.Item) {
            return response(404, 'Error: Product not found');
        }

        const stockParams = {
            TableName: process.env.STOCKS_TABLE as string,
            Key: {
                product_id: productId,
            },
        };

        const stockResult = await dynamoDB.get(stockParams).promise();

        const productWithStock = {
            id: result.Item.id,
            count: stockResult.Item?.count || 0,
            price: result.Item.price,
            title: result.Item.title,
            description: result.Item.description,
        };

        return response(200, productWithStock);
    } catch (err: unknown) {
        console.error(err);
        return response(500, { error: 'Internal Server Error' });
    }
};
