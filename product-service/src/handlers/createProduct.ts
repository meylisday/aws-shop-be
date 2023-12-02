import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { response } from "../utils";
import { v4 as uuidv4 } from "uuid";
import Ajv from "ajv";

const dynamoDB = new DynamoDB.DocumentClient({ region: "us-east-1" });

const ajv = new Ajv();

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

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  console.log("Incoming request:", event);

  try {
    const requestBody = JSON.parse(event.body || "{}");

    const valid = validateProduct(requestBody);

    if (!valid) {
        return response(400, {
            error: "Invalid request body. Please check the data format.",
            errors: validateProduct.errors,
        });
    }

    const productId = uuidv4();

    const productParams = {
      TableName: process.env.PRODUCTS_TABLE as string,
      Item: {
        id: productId,
        title: requestBody.title,
        description: requestBody.description,
        price: requestBody.price,
      },
    };

    const stockParams = {
      TableName: process.env.STOCKS_TABLE as string,
      Item: {
        product_id: productId,
        count: requestBody.count || 0,
      },
    };

    const transactionParams = {
      TransactItems: [
        {
          Put: productParams,
        },
        {
          Put: stockParams,
        },
      ],
    };

    await dynamoDB.transactWrite(transactionParams).promise();

    return response(200, {
      message: "Product and stock created successfully",
      productId,
    });
  } catch (err: any) {
    console.error(err);

    if (err.code === "ConditionalCheckFailedException") {
      return response(500, {
        error: "Transaction failed. Product and stock were not created.",
      });
    }

    return response(500, { error: "Internal Server Error" });
  }
};