import { v4 as uuidv4 } from "uuid";
import { DynamoDB } from "aws-sdk";

export const createProduct = async (newProduct: any) => {
  const dynamoDB = new DynamoDB.DocumentClient({ region: "us-east-1" });
  const productId = uuidv4();

  const { title, description, price, count } = newProduct;

  const transactionParams = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.PRODUCTS_TABLE as string,
          Item: {
            id: productId,
            title: title,
            description: description,
            price: price,
          },
        },
      },
      {
        Put: {
          TableName: process.env.STOCKS_TABLE as string,
          Item: {
            product_id: productId,
            count: count || 0,
          },
        },
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();
    console.log('Product created successfully:', newProduct);
    return { ...newProduct, productId };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};
