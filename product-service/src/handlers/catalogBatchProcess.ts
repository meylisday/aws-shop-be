import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { createProduct } from "../db/products";
import { response } from "../utils";
import { get } from "lodash";
import * as dotenv from 'dotenv';
dotenv.config();

export const handler = async (event: any) => {
  const snsClient = new SNSClient({ region: 'us-east-1' })

  try {
    console.log("sqs event", event);

    const newProducts = [];

    for (const record of event.Records) {
      const parsedBody = JSON.parse(record.body)
      console.log(parsedBody);
      const newProductData = await createProduct(parsedBody);
      newProducts.push(newProductData);
      await snsClient.send(
        new PublishCommand({
          Subject: "New files Added to Catalog",
          Message: JSON.stringify(newProductData),
          TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN
        })
      );
    }
    return response(200, 'Product created');
  } catch (err) {
    console.log(err);
    return response(500, err);
  }
};
