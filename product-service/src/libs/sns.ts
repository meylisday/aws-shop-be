import { SNSClient } from '@aws-sdk/client-sns';
import * as dotenv from 'dotenv';

dotenv.config();

export default new SNSClient({ region: process.env.PRODUCT_AWS_REGION })