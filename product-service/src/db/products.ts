import { v4 as uuidv4 } from "uuid";
import { DynamoDB } from "aws-sdk";
import * as dotenv from "dotenv";
import Ajv from "ajv";
import { response } from "../utils";

dotenv.config();

const dynamoDB = new DynamoDB.DocumentClient({ region: "us-east-1" });

export const createProduct = async (newProduct: any): Promise<any> => {
  const productId = uuidv4();

  const ajv = new Ajv();

  const product = {
    title: newProduct.title,
    description: newProduct.description,
    price: parseInt(newProduct.price),
    count: parseInt(newProduct.count),
}

  console.log('product:', product);

  const productSchema = {
    type: "object",
    properties: {
      title: { type: "string", maxLength: 255 },
      description: { type: "string", maxLength: 1000 },
      price: { type: "number", minimum: 0 },
      count: { type: "integer", minimum: 0 },
    },
    required: ["title", "description", "price", "count"],
    additionalProperties: false,
  };

  const validateProduct = ajv.compile(productSchema);

  console.log('validate product', validateProduct);

  const valid = validateProduct(product);

  console.log('valid', valid);

  if (!valid) {
    return response(400, {
      error: "Invalid request body. Please check the data format.",
      errors: validateProduct.errors,
    });
  }

  const transactionParams = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.PRODUCTS_TABLE as string,
          Item: {
            id: productId,
            title: product.title,
            description: product.description,
            price: product.price,
          },
        },
      },
      {
        Put: {
          TableName: process.env.STOCKS_TABLE as string,
          Item: {
            product_id: productId,
            count: product.count || 0,
          },
        },
      },
    ],
  };

  try {
    await dynamoDB.transactWrite(transactionParams).promise();
    console.log("Product created successfully:", newProduct);
    return { ...newProduct, productId };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};
