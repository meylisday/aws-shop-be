import { SQSEvent } from 'aws-lambda';
import { parseRecord } from '../utils';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { createProduct } from '../db/products';

const snsClient = new SNSClient({
    region: 'us-east-1',
});

export const handler = async (event: SQSEvent) => {
  console.log('SQS event:', JSON.stringify(event));

  await Promise.all(event.Records.map(async (record) => {
    try {
      const [product, stock] = parseRecord(record);

      if (product.title === "" || product.description === "") {
        console.log('>>> Empty title or description. Skipping further processing.');
        return;
      }

      console.log('product and stock', product, stock);

      const createdProduct = await createProduct(product, stock);

      console.log('create product', createdProduct);

      if (createdProduct) {
        const res = await snsClient.send(new PublishCommand({
          Subject: "New files Added to Catalog",
          Message: JSON.stringify(createdProduct),
          TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN
        }));

        console.log('>>> catalogBatchProcess success', res);
      } else {
        console.log('>>> Error creating product');
      }
    } catch (err) {
      console.log('>>> catalogBatchProcess error', err);
    }
  }));
};