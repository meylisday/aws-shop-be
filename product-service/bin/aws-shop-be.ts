#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { SwaggerUi } from "@pepperize/cdk-apigateway-swagger-ui";

export const app = new cdk.App();

export const productServiceStack = new cdk.Stack(app, 'ProductServiceStack', {
    env: { region: 'us-east-1' }
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
    runtime: lambda.Runtime.NODEJS_18_X,
    environment: {
        PRODUCT_AWS_REGION: 'us-east-1',
    }
}

const api = new apigateway.RestApi(productServiceStack, 'ProductApi', {
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

const getProductsList = new NodejsFunction(productServiceStack, 'GetProductListLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductsList',
    entry: 'src/handlers/getProductsList.ts'
});

const productsResource = api.root.addResource('products');

const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsList, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});

productsResource.addMethod("GET", getProductsListIntegration);

const getProductById = new NodejsFunction(productServiceStack, 'GetProductByIdLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductById',
    entry: 'src/handlers/getProductById.ts'
})

const productResource = productsResource.addResource('{productId}');

const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductById, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});

productResource.addMethod("GET", getProductByIdIntegration);


new SwaggerUi(productServiceStack, "SwaggerUI", { resource: api.root });

