#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { SwaggerUi } from "@pepperize/cdk-apigateway-swagger-ui";

export const app = new cdk.App();

export const stack = new cdk.Stack(app, 'ImportServiceStack', {
    env: { region: 'us-east-1' }
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
    runtime: lambda.Runtime.NODEJS_18_X,
    environment: {
        PRODUCT_AWS_REGION: 'us-east-1',
        ACCOUNT_ID: '5041-3785-4779',
    }
}

const bucket = new s3.Bucket(stack, 'ImportBucket', { 
    bucketName: 'aws-shop-be-import-products',       
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true
});

const importProductsFileLambda = new NodejsFunction(stack, 'ImportProductsFileLambda', {
    ...sharedLambdaProps,
    functionName: 'importProductsFile',
    entry: 'src/handlers/importProductsFile.ts',
});

const importFileParserLambda = new NodejsFunction(stack, 'ImportFileProductsParserLambda', {
    ...sharedLambdaProps,
    functionName: 'importFileParser',
    entry: 'src/handlers/importFileParser.ts',
  });

bucket.grantReadWrite(importProductsFileLambda);
bucket.grantReadWrite(importFileParserLambda);
bucket.grantDelete(importFileParserLambda);

const api = new apigateway.RestApi(stack, 'ProductApi', {
    restApiName: 'Import Service',
    description: 'This service import products',
    defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [HttpMethods.GET, HttpMethods.PUT]
    },
    deployOptions: {
        stageName: 'dev'
    }
});

const importModel = api.addModel('ImportModel', {
    modelName: 'ImportModel',
    contentType: 'application/json',
    schema: {
      schema: apigateway.JsonSchemaVersion.DRAFT4,
      title: 'importModel',
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
        name: {
          type: apigateway.JsonSchemaType.STRING,
        },
      },
    },
  });

const importProductFilesIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);

const importProductFilesResource = api.root.addResource('import');

importProductFilesResource.addMethod('GET', importProductFilesIntegration, {
    methodResponses: [
    {
        statusCode: '200',
        responseModels: {
        'application/json': importModel,
        },
        responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        },
    },
    {
        statusCode: '400',
        responseModels: {
        'application/json': importModel,
        },
        responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        },
    },
    ],
});

bucket.addEventNotification(
    s3.EventType.OBJECT_CREATED, 
    new s3n.LambdaDestination(importFileParserLambda), {
    prefix: 'uploaded',
});

new SwaggerUi(stack, "SwaggerUI", { resource: api.root });