import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import { HttpMethods } from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import { SwaggerUi } from "@pepperize/cdk-apigateway-swagger-ui";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { ResponseType, TokenAuthorizer } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export const app = new cdk.App();

export const stack = new cdk.Stack(app, "ImportServiceStack", {
  env: { region: "us-east-1" },
});

const authorizer = Function.fromFunctionArn(stack, 'basicAuthorizer', 'arn:aws:lambda:us-east-1:504137854779:function:basicAuthorizer');

const queue = sqs.Queue.fromQueueArn(stack, 'ImportFileQueue', 'arn:aws:sqs:us-east-1:504137854779:import-file-queue');

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: 'us-east-1',
    ACCOUNT_ID: '5041-3785-4779',
    IMPORT_SQS_URL: queue.queueUrl
  },
};

const bucket = new s3.Bucket(stack, "ImportBucket", {
  bucketName: "aws-shop-be-import-products",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

const importProductsFileLambda = new NodejsFunction(
  stack,
  "ImportProductsFileLambda",
  {
    ...sharedLambdaProps,
    functionName: "importProductsFile",
    entry: "src/handlers/importProductsFile.ts",
  }
);

const importFileParserLambda = new NodejsFunction(
  stack,
  "ImportFileProductsParserLambda",
  {
    ...sharedLambdaProps,
    functionName: "importFileParser",
    entry: "src/handlers/importFileParser.ts",
  }
);

queue.grantSendMessages(importFileParserLambda);

bucket.grantReadWrite(importProductsFileLambda);
bucket.grantReadWrite(importFileParserLambda);
bucket.grantDelete(importFileParserLambda);

const api = new apigateway.RestApi(stack, "ImportApi", {
  restApiName: "Import Service",
  description: "This service import products",
  defaultCorsPreflightOptions: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [HttpMethods.GET, HttpMethods.PUT],
  },
  deployOptions: {
    stageName: "dev",
  },
});

const importProductFilesIntegration = new apigateway.LambdaIntegration(
  importProductsFileLambda
);

const importProductFilesResource = api.root.addResource("import", {
  defaultCorsPreflightOptions: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [HttpMethods.GET, HttpMethods.PUT],
  },
});

api.addGatewayResponse('ImportProductsFileUnauthorized', {
  type: ResponseType.UNAUTHORIZED,
  statusCode: '401',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'"
  },
});

api.addGatewayResponse('ImportProductsFileForbidden', {
  type: ResponseType.ACCESS_DENIED,
  statusCode: '403',
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'"
  },
});

const authRole = new Role(stack, 'ImportProductsFileAuthorizerRole', {
  assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
});

authRole.addToPolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [authorizer.functionArn],
  }),
);

const importProductsFileAuthorizer = new TokenAuthorizer(stack, 'ImportProductsFileAuthorizer', {
  handler: authorizer,
  assumeRole: authRole,
});

importProductFilesResource.addMethod("GET", importProductFilesIntegration, {
  authorizer: importProductsFileAuthorizer,
});

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParserLambda),
  {
    prefix: "uploaded",
  }
);

new SwaggerUi(stack, "SwaggerUI", { resource: api.root });