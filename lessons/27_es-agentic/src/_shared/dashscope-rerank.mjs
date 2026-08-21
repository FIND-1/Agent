import { BaseDocumentCompressor } from "@langchain/core/retrievers/document_compressors";

export class DashScopeRerank extends BaseDocumentCompressor {
  constructor({ apiKey, model = "qwen3-rerank", topN = 3, baseUrl } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.topN = topN;
    this.baseUrl = baseUrl;
  }

  async compressDocuments(documents, query, _callbacks) {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("DashScope Rerank 缺少 apiKey 或 baseUrl");
    }

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: {
          query,
          documents: documents.map((d) => d.pageContent),
        },
        parameters: {
          return_documents: false,
          top_n: this.topN,
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(
        `DashScope rerank ${res.status}: ${JSON.stringify(json)}`,
      );
    }

    const results = json?.output?.results;
    if (!Array.isArray(results)) {
      throw new Error(`unexpected rerank response: ${JSON.stringify(json)}`);
    }

    return results
      .filter((item) => Number.isInteger(item.index) && documents[item.index])
      .map((item) => documents[item.index]);
  }
}
