import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

AWS.config.update({ region: 'us-east-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const createProduct = async (title, description, price) => {
  const params = {
    TableName: 'products',
    Item: {
      id: uuidv4(),
      title,
      description,
      price,
    },
  };

  await dynamoDB.put(params).promise();
};

const createStock = async (productId, count) => {
  const params = {
    TableName: 'stocks',
    Item: {
      product_id: productId,
      count,
    },
  };

  await dynamoDB.put(params).promise();
};

const populateTables = async () => {
  try {
    await createProduct('Product 1', 'Description 1', 10);
    await createProduct('Product 2', 'Description 2', 20);
    await createProduct('Product 3', 'Description 3', 30);
    await createProduct('Product 4', 'Description 4', 30);
    await createProduct('Product 5', 'Description 5', 30);

    const products = await dynamoDB.scan({ TableName: 'products' }).promise();

    for (const product of products.Items) {
      await createStock(product.id, Math.floor(Math.random() * 100) + 1);
    }

    console.log('Tables populated successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
};

populateTables();