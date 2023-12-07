import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyResult } from "aws-lambda";
import { response } from "../utils";

export const handler = async (event: any = {}): Promise<APIGatewayProxyResult> => {
  
    console.log("Incoming request:", event);
  
    try {
      const name = event.queryStringParameters?.name;
  
      if (!name) {
        return response(400, { error: "Invalid name" });
      }
  
      const { BUCKET_NAME } = process.env;
  
      const client = new S3Client({ region: process.env.AWS_REGION });
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME ?? "aws-shop-be-import-products",
        Key: `uploaded/${name}`,
        Body: "",
        ContentType: "text/csv",
      });
  
      console.log("Sending file to S3...");
      await client.send(command);
  
      console.log("Getting signed URL...");
      const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  
      console.log("Returning response...");

      console.log("Response:", signedUrl);
      return response(200, signedUrl);
    } catch (e) {
      return response(500, {
        message: { error: "Internal Server Error" },
      });
    }
  };
  
