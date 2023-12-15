import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Readable } from "stream";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";

const s3Client = new S3Client({ region: "us-east-1" });

const client = new SQSClient({ region: "us-east-1" });

const move = async ({
  bucket,
  from,
  to,
}: {
  bucket: string;
  from: string;
  to: string;
}) => {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${from}`,
      Key: to,
    })
  );
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: from,
    })
  );
};

export const handler = async (event: S3Event) => {
  try {
    console.log("importFileParser", JSON.stringify(event));

    const bucket = event.Records[0].s3.bucket.name;
    const fileName = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const { Body: stream } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: decodeURIComponent(fileName),
      })
    );
    if (!stream) return;

    const messages: object[] = [];
    await new Promise<void>((resolve, reject) => {
      (stream as Readable)
        .pipe(csv())
        .on("data", (data: object) => {
          messages.push(data);
        })
        .on("end", async () => {
          await move({
            from: fileName,
            to: fileName.replace("uploaded/", "parsed/"),
            bucket,
          });
          console.log("file moved");
          resolve();
        })
        .on("error", (error: any) => {
          reject(error);
        });
    });

    await Promise.all(
      messages.map((message) => {
        return client.send(
          new SendMessageCommand({
            QueueUrl:
              "https://sqs.us-east-1.amazonaws.com/504137854779/import-file-queue",
            MessageBody: JSON.stringify(message),
          })
        );
      })
    );
    console.log("parsing succeed");
  } catch (err: any) {
    console.log("parsing error", err);
  }
};
