import { DynamoDB } from 'aws-sdk';
import { response } from '../utils';
import { APIGatewayProxyResult } from 'aws-lambda';

const dynamoDB = new DynamoDB.DocumentClient({ region: 'us-east-1' });

export const handler = async (event: any = {}): Promise<APIGatewayProxyResult> => {
    
    console.log("Incoming request:", event);

    try {
        const params = {
            TableName: 'products',
        };

        const result = await dynamoDB.scan(params).promise();

        const products = result.Items?.map(async (item) => {
            const stockParams = {
                TableName: 'stocks',
                Key: {
                    product_id: item.id,
                },
            };

            const stockResult = await dynamoDB.get(stockParams).promise();

            return {
                id: item.id,
                count: stockResult.Item?.count || 0,
                price: item.price,
                title: item.title,
                description: item.description,
            };
        }) || [];

        const productsWithStock = await Promise.all(products);

        return response(200,
            productsWithStock
        );
    } catch (err: unknown) {
        console.error(err);
        return response(500, { error: 'Internal Server Error' });
    }
};
