import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../src/handlers/importFileParser';
import { S3Event } from 'aws-lambda';

const mockEvent = {
  Records: [
    {
      s3: {
        bucket: {
          name: 'test-bucket',
        },
        object: {
          key: 'uploaded/test.csv',
        },
      },
    },
  ],
} as unknown;

const validEvent = mockEvent as S3Event;

describe('import file parser lambda tests', () => {
  it('Lambda should return 500 on S3 error', async () => {
    const s3Mock = mockClient(S3Client);
    s3Mock.on(GetObjectCommand, { Bucket: 'test-bucket', Key: 'uploaded/test.csv' }).rejects(new Error('S3 error'));

    const responseResult = await handler(validEvent);
    expect(responseResult.statusCode).toBe(500);
    expect(JSON.parse(responseResult.body)).toEqual({ message:"Error processing S3 event:", e:{}});
  });
});
