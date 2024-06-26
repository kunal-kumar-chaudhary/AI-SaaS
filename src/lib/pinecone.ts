import { Pinecone } from "@pinecone-database/pinecone";
import { downladFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

let pinecone: Pinecone | null = null;
export const getPineconeClient = async () => {
  if (!pinecone) {
    const pinecone = new Pinecone({ apiKey: process.env.PINCONE_API_KEY! });
  }
  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number}
  }
}

export async function loadS3IntoPinecone(file_key: string){
    // obtain the pdf
    console.log("loading s3 into pinecone");
    const file_name = await downladFromS3(file_key);
    if(!file_name){
      throw new Error("error downloading file from s3");
    }
    const loader = new PDFLoader(file_name!);
    const pages = (await loader.load()) as PDFPage[];
    return pages;
}
