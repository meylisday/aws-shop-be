import AWS from 'aws-sdk';

AWS.config.update({ region: 'us-east-1' });

const dynamodb = new AWS.DynamoDB();

dynamodb.createTable({
  TableName: 'products',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
}, (err, data) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Table "products" created successfully');
  }
});

// Создание таблицы 'stocks'
dynamodb.createTable({
  TableName: 'stocks',
  KeySchema: [
    { AttributeName: 'product_id', KeyType: 'HASH' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'product_id', AttributeType: 'S' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5, 
    WriteCapacityUnits: 5,
  },
}, (err, data) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Table "stocks" created successfully');
  }
});