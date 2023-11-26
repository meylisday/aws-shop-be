#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
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

//getProducts
const getProductsList = new NodejsFunction(productServiceStack, 'GetProductListLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductsList',
    entry: 'src/handlers/getProductsList.ts'
});

const lambdaRole = getProductsList.role!;
lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

const productsResource = api.root.addResource('products');
const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsList, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productsResource.addMethod("GET", getProductsListIntegration);

//getProductById
const getProductById = new NodejsFunction(productServiceStack, 'GetProductByIdLambda', {
    ...sharedLambdaProps,
    functionName: 'getProductById',
    entry: 'src/handlers/getProductById.ts'
})

const lambdaRoleGetProductById = getProductById.role!;
lambdaRoleGetProductById.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

const productResource = productsResource.addResource('{productId}');
const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductById, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productResource.addMethod("GET", getProductByIdIntegration);

//createProduct
const createProduct = new NodejsFunction(productServiceStack, 'CreateProductLambda', {
    ...sharedLambdaProps,
    functionName: 'createProduct',
    entry: 'src/handlers/createProduct.ts'
});

const lambdaRoleCreateProduct = createProduct.role!;
lambdaRoleCreateProduct.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

const createProductIntegration = new apigateway.LambdaIntegration(createProduct, {
    requestTemplates: { "application/json": '{ "statusCode": "200" }' }
});
productsResource.addMethod("POST", createProductIntegration);


new SwaggerUi(productServiceStack, "SwaggerUI", { resource: api.root });

