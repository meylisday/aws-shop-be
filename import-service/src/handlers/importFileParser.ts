import { S3Event } from "aws-lambda";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csv from "csv-parser";
import { response } from "../utils";

export const handler = async (event: S3Event) => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const params = {
      Bucket: bucket,
      Key: key,
    };

    try {
      const file = await s3Client.send(new GetObjectCommand(params));
      const readableStream = file.Body;
      if (!(readableStream instanceof Readable)) {
        throw new Error("Failed to read file");
      }

      await new Promise((resolve, reject) => {
        readableStream
          .pipe(csv())
          .on("data", async (data) => {
            console.log(data);
          })
          .on("error", reject)
          .on("end", resolve);
      });
      const copyParams = {
        Bucket: bucket,
        CopySource: bucket + "/" + key,
        Key: key.replace("uploaded", "parsed"),
      };

      await s3Client.send(new CopyObjectCommand(copyParams));
      console.log("Copied into parsed folder");

      await s3Client.send(new DeleteObjectCommand(params));
      console.log("Deleted from uploaded folder");
    } catch (e) {
      return response(500, {
        message: "Error processing S3 event:",
        e,
      });
    }
  }
  return response(200, { message: "File parsed successfully" });
};
