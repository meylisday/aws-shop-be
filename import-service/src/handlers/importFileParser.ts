import { S3Event } from "aws-lambda";
import * as sdk from "aws-sdk";
import csv from "csv-parser";
import { Transform, TransformCallback } from "stream";
import * as dotenv from "dotenv";
dotenv.config();

const s3Bucket = new sdk.S3({ region: "eu-west-1" });
const sqs = new sdk.SQS();

export const handler = async function (event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key,
    };

    console.log(`readFile start: ${params.Key}`);
    await fileParseStream(params, record);
  }
};

async function fileParseStream(params: { Bucket: string; Key: string }, record: any) {
  const stream = s3Bucket.getObject(params).createReadStream();

  return new Promise<void>((res, rej) => {
    const transformStream = new Transform({
      objectMode: true,
      transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        sendToSQS(chunk);
        callback();
      },
    });

    stream
      .pipe(csv())
      .pipe(transformStream)
      .on("finish", async () => {
        const bucketName = params.Bucket;
        const key = decodeURIComponent(params.Key.replace(/\+/g, " "));
        console.log(`${key} stream finish`);

        const sourceKey = key.replace("uploaded", "parsed");
        if (key === sourceKey) {
          console.log("File is already in the parsed folder");
          return res();
        }

        try {
          await s3Bucket
            .copyObject({
              CopySource: `${bucketName}/${key}`,
              Bucket: bucketName,
              Key: sourceKey,
            })
            .promise();

          await s3Bucket
            .deleteObject({
              Bucket: bucketName,
              Key: key,
            })
            .promise();

          res();
        } catch (error: any) {
          console.error("Error occurred during file moving: ", error.message);
          rej(error);
        }
      })
      .on("error", (error: Error) => {
        console.error("Error occurred during stream processing: ", error.message);
        rej(error);
      });
  });
}

function sendToSQS(data: any) {
  const params = {
    QueueUrl: "https://sqs.us-east-1.amazonaws.com/504137854779/import-file-queue",
    MessageBody: JSON.stringify(data),
  };

  sqs.sendMessage(params, (err) => {
    if (err) {
      console.error("Error sending message", err);
    } else {
      console.log("Message successfully sent", data.MessageId);
    }
  });
}
