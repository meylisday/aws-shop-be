import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import * as base64 from 'base-64';
import dotenv from 'dotenv';

dotenv.config();

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  try {
    const credentialsEnvVariable = process.env.CREDENTIALS ?? '';

    const [username, password] = credentialsEnvVariable.split(':');

    if (!event.authorizationToken) {
      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn,
            },
          ],
        },
      };
    }

    const [, token] = event.authorizationToken.split(' ');
    const decodedToken = base64.decode(token);

    const [providedUsername, providedPassword] = decodedToken.split(':');

    if (providedUsername === username && providedPassword === password) {
      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn,
            },
          ],
        },
      };
    } else {
      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn,
            },
          ],
        },
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
