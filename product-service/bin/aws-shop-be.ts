#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { SwaggerUi } from "@pepperize/cdk-apigateway-swagger-ui";
import * as dotenv from 'dotenv';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

dotenv.config();

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ProductServiceStack', {
    env: { region: process.env.PRODUCT_AWS_REGION! }
})

const importProductTopic = new sns.Topic(stack, 'ImportProductTopic', {
    topicName: 'import-products-topic'
})

const importQueue = new sqs.Queue(stack, 'ImportQueue', {
    queueName: 'import-file-queue'
})

new sns.Subscription(stack, 'BigStockSubscription', {
    endpoint: process.env.BIG_STOCK_EMAIL!,
    protocol: sns.SubscriptionProtocol.EMAIL,
    topic: importProductTopic,
    filterPolicy: {
        count: sns.SubscriptionFilter.numericFilter({ lessThanOrEqualTo: 10 }),
    },
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
    runtime: lambda.Runtime.NODEJS_18_X,
    environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
        ACCOUNT_ID: process.env.ACCOUNT_ID!,
        PRODUCTS_TABLE: process.env.PRODUCTS_TABLE!,
        STOCKS_TABLE: process.env.STOCKS_TABLE!,
        IMPORT_PRODUCTS_TOPIC_ARN: importProductTopic.topicArn
    }
}

const catalogBatchProcess = new NodejsFunction(stack, 'CatalogBatchProcessLambda', {
    ...sharedLambdaProps,
    functionName: 'catalogBatchProcess',
    entry: 'src/handlers/catalogBatchProcess.ts',
    initialPolicy: [
        new iam.PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem'],
            resources: [
                `arn:aws:dynamodb:us-east-1:504137854779:table/products`,
                `arn:aws:dynamodb:us-east-1:504137854779:table/stocks`
            ],
        }),
    ],
});

importProductTopic.grantPublish(catalogBatchProcess);
catalogBatchProcess.addEventSource(new SqsEventSource(importQueue, { batchSize: 5 }));

const api = new apigateway.RestApi(stack, 'ProductApi', {
    restApiName: 'Product Service',
    description: 'This service serves products.',
    defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: apigateway.Cors.ALL_METHODS
    },
    deployOptions: {
        stageName: 'dev'
    }
});


//getProducts
const getProductsList = new NodejsFunction(stack, 'GetProductListLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductsList',
    entry: 'src/handlers/getProductsList.ts',
    initialPolicy: [
        new iam.PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem'], 
            resources: [
                `arn:aws:dynamodb:us-east-1:504137854779:table/products`,
                `arn:aws:dynamodb:us-east-1:504137854779:table/stocks`
            ],
        }),
    ],
});

const productsResource = api.root.addResource('products');
const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsList, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productsResource.addMethod("GET", getProductsListIntegration);

//getProductById
const getProductById = new NodejsFunction(stack, 'GetProductByIdLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductById',
    entry: 'src/handlers/getProductById.ts',
    initialPolicy: [
        new iam.PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem'],
            resources: [
                `arn:aws:dynamodb:us-east-1:504137854779:table/products`,
                `arn:aws:dynamodb:us-east-1:504137854779:table/stocks`
            ],
        }),
    ],
})

const productResource = productsResource.addResource('{productId}');
const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductById, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productResource.addMethod("GET", getProductByIdIntegration);

//createProduct
const createProduct = new NodejsFunction(stack, 'CreateProductLambda', {
    ...sharedLambdaProps,
    functionName: 'createProduct',
    entry: 'src/handlers/createProduct.ts',
    initialPolicy: [
        new iam.PolicyStatement({
            actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem'],
            resources: [
                `arn:aws:dynamodb:us-east-1:504137854779:table/products`,
                `arn:aws:dynamodb:us-east-1:504137854779:table/stocks`
            ],
        }),
    ],
});

const createProductIntegration = new apigateway.LambdaIntegration(createProduct, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productsResource.addMethod("POST", createProductIntegration);

new SwaggerUi(stack, "SwaggerUI", { resource: api.root });