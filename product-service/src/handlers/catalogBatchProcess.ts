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
    const records = get(event, "Records", []);

    for (const record of records) {
      const parsedBody = JSON.parse(record.body)
      const newProductData = await createProduct(parsedBody);

      await snsClient.send(
        new PublishCommand({
          Subject: "New files Added to Catalog",
          Message: JSON.stringify(newProductData),
          TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN,
          MessageAttributes: {
            count: {
              DataType: 'Number',
              StringValue: newProductData.count,
            },
          },
        })
      );
    }
    return response(200, records);
  } catch (err) {
    console.log(err);
    return response(500, err);
  }
};
