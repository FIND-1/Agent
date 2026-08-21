// ES 与 Milvus 使用同一个业务 ID，混合召回后才能稳定去重。
export const HYBRID_INDEX_NAME = "life_notes";
export const ES_NODE = "http://localhost:9200";
export const MILVUS_ADDRESS = "localhost:19530";
export const MILVUS_TEXT_FIELD = "doc_text";
export const MILVUS_VECTOR_FIELD = "embedding";
