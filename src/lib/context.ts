import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbedding(
  embeddings: number[],
  file_key: string
) {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

  const index = await pinecone.index("chatpdf");

  try {
    const namespace = await convertToAscii(file_key);
    const queryResult = await index.namespace(namespace).query({
      vector: embeddings,
      topK: 5,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (err) {
    throw err;
  }
}

// need file_key for searching the embedding vector in the correct namespace
export async function getContext(query: string, file_key: string) {

    
  const queryEmbeddings = await getEmbeddings(query);
  const matches = await getMatchesFromEmbedding(queryEmbeddings, file_key);

  const qualifyingDocs = matches.filter((match: any) => match.score > 0);
  type MetaData = {
    pageNumber: number;
    text: string;
  };

  let docs = qualifyingDocs.map((match) => (match.metadata as MetaData).text);

  return docs.join("\n").substring(0, 10000);
}
