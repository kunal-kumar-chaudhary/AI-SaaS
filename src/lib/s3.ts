import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

export async function uploadToS3(file: File) {
  const REGION = "ap-south-1"; // Specify your region
  const Bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  const accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY;

  // Log the environment variables to ensure they are loaded correctly
  console.log("Bucket:", Bucket);
  console.log("Access Key ID:", accessKeyId);
  console.log("Secret Access Key:", secretAccessKey);

  if (!Bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 bucket name or AWS credentials are not defined in environment variables");
  }

  const s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const file_key = "uploads/" + Date.now().toString() + file.name.replace(" ", "-");

  const params = {
    Bucket,
    Key: file_key,
    Body: file,
  };

  try {
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    console.log("uploaded to s3 successfully", file_key);

    return {
      file_key,
      file_name: file.name,
    };
  } catch (e) {
    console.log("error uploading to s3", e);
    throw e; // Re-throw the error to be caught in the calling function
  }
}

export function getS3Url(file_key: string) {
  const REGION = "ap-south-1"; // Ensure region is consistent
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${REGION}.amazonaws.com/${file_key}`;
  return url;
}
