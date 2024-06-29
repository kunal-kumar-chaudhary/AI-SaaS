import { Pinecone, PineconeRecord} from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {Document, RecursiveCharacterTextSplitter} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from "md5";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;
export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
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
    const file_name = await downloadFromS3(file_key);
    if(!file_name){
      throw new Error("error downloading file from s3");
    }
    const loader = new PDFLoader(file_name!);
    const pages = (await loader.load()) as PDFPage[];

    // split and segment the pdf into smaller chunks
    const documents = await Promise.all(pages.map(prepareDocument))

    // vectorize and embed the documents
    const vectors = await Promise.all(documents.flat().map(embedDocuments));

    // upload the vectors to pinecone
    const client = await getPineconeClient();
    if (!client) {
      throw new Error("Failed to get Pinecone client");
    }
    const pineconeIndex = client.index("chatpdf");

    // inserting the vectors into the pinecone index
    const namespace = convertToAscii(file_key);
    // inserting the vectors into the pinecone index
    await chunkedUpsert(pineconeIndex, vectors, namespace);
    return documents[0];
}

// chunking the vectors and inserting them into the pinecone index to avoid rate limiting
async function chunkedUpsert(index: any, vectors: PineconeRecord[], namespace: string, chunkSize: number = 100) {
  for (let i = 0; i < vectors.length; i += chunkSize) {
      const chunk = vectors.slice(i, i + chunkSize);
      await index.namespace(namespace).upsert(chunk);
  }
}

async function embedDocuments(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}




export const truncateStringByBytes = (str: string, bytes: number) => {
      const enc = new TextEncoder();
      return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage){
      let {pageContent, metadata} = page;
      // replacing all new line characters with empty string
      pageContent = pageContent.replace(/\n/g, '');
      // split the docs
      const splitter = new RecursiveCharacterTextSplitter();
      const docs = await splitter.splitDocuments([
        new Document({
          pageContent,
          metadata: {
            pageNumber: metadata.loc.pageNumber,
            text: truncateStringByBytes(pageContent, 36000),
          }
        })
      ]);
    return docs;
}