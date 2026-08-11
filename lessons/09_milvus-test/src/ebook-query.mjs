import "@lessons/shared/env-loader";
import { createEmbeddings } from "@lessons/shared/model";
import { MilvusClient, MetricType } from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'ebook_collection';
const VECTOR_DIM = 1024;
const BOOK_ID = 'harry_potter_and_philosophers_stone';

const embeddings = createEmbeddings({
  dimensions: VECTOR_DIM,
});

const client = new MilvusClient({
  address: 'localhost:19530'
});

async function getEmbedding(text) {
  const result = await embeddings.embedQuery(text);
  return result;
}

async function main() {
  try {
    console.log('Connecting to Milvus...');
    await client.connectPromise;
    console.log('✓ Connected\n');

    // 确保集合已加载
    try {
      await client.loadCollection({ collection_name: COLLECTION_NAME });
      console.log('✓ 集合已加载\n');
    } catch (error) {
      // 如果已经加载，会报错，忽略即可
      if (!error.message.includes('already loaded')) {
        throw error;
      }
      console.log('✓ 集合已处于加载状态\n');
    }

    // 向量搜索
    console.log('Searching for similar ebook content...');
    const query = '哈利是怎样得到魔法石的？';
    console.log(`Query: "${query}"\n`);

    const queryVector = await getEmbedding(query);
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: 5,
      filter: `book_id == "${BOOK_ID}"`,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'book_id', 'book_name', 'chapter_num', 'index', 'content']
    });

    console.log(`Found ${searchResult.results.length} results:\n`);
    searchResult.results.forEach((item, index) => {
      console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Book ID: ${item.book_id}`);
      console.log(`   Book Name: ${item.book_name}`);
      console.log(`   Chapter: 第 ${item.chapter_num} 章`);
      console.log(`   Index: ${item.index}`);
      console.log(`   Content: ${item.content}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();



