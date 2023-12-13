import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { response } from "../utils";
import Ajv from "ajv";
import { createProduct } from '../db/products';
import { v4 as uuidv4 } from "uuid";

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

    const { title, description, price, count } = requestBody

    const result = await createProduct( {
      productId,
      title,
      description,
      price,
    },
    {
      product_id: productId,
      count,
    },);

    return response(200, {
      message: "Product and stock created successfully",
      result,
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