import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';

dotenv.config();

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

export const createProduct = async (product: object, stock: object): Promise<any> => {

  const command = new TransactWriteItemsCommand({
    TransactItems: [
      {
        Put: {
          TableName: process.env.PRODUCTS_TABLE,
          Item: marshall(product)
        },
      },
      {
        Put: {
          TableName: process.env.STOCKS_TABLE,
          Item: marshall(stock),
        },
      },
    ],
  });

  try {
    await dynamoDB.send(command);
    return { product, stock };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};
