import { HfInference } from "@huggingface/inference";

export async function getEmbeddings(text: string) {
  const hf = new HfInference(process.env.HF_TOKEN!);
  text = text.replace(/\n/g, " ");

  const embedding1 = await hf.featureExtraction({
    model: "sentence-transformers/all-mpnet-base-v2",
    inputs: text,
  });

  const embedding2 = await hf.featureExtraction({
    model: "sentence-transformers/all-distilroberta-v1",
    inputs: text,
  });

  const embeddings1Array = embedding1 as number[];
  const embeddings2Array = embedding2 as number[];

  const concatenatedEmbeddings = embeddings1Array.concat(embeddings2Array);

  return concatenatedEmbeddings;
}

