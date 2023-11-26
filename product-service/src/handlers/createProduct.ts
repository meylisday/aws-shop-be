import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { response } from "../utils";
import { v4 as uuidv4 } from "uuid";

const dynamoDB = new DynamoDB.DocumentClient({ region: "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  console.log("Incoming request:", event);

  try {
    const requestBody = JSON.parse(event.body || "{}");

    const requiredFields = ['title', 'description', 'price'];
    const missingFieldsResponse = checkRequiredFields(requestBody, requiredFields);

    if (missingFieldsResponse) {
        return missingFieldsResponse;
    }

    const productId = uuidv4();

    const productParams = {
      TableName: "products",
      Item: {
        id: productId,
        title: requestBody.title,
        description: requestBody.description,
        price: requestBody.price,
      },
    };

    const stockParams = {
      TableName: "stocks",
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

export const checkRequiredFields = (requestBody: any, requiredFields: string[]): APIGatewayProxyResult | null => {
    const missingFields = requiredFields.filter(field => !requestBody[field]);

    if (missingFields.length > 0) {
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        return response(400, { error: errorMessage });
    }

    return null;
};
