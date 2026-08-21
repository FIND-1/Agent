/**
 * 将同一批业务文档写入 ES 与 Milvus：前者服务关键词召回，后者服务语义召回。
 * 与前两个 ES 示例相比，本例新增嵌入生成和向量库写入，并会重建同名索引/集合。
 * 需要根目录 .env、Elasticsearch + IK、Milvus 和远程 Embeddings API。
 */
import { Client } from "@elastic/elasticsearch";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
  DataType,
  IndexType,
  MetricType,
  MilvusClient,
} from "@zilliz/milvus2-sdk-node";
import {
  ES_NODE,
  HYBRID_INDEX_NAME,
  MILVUS_ADDRESS,
  MILVUS_TEXT_FIELD,
  MILVUS_VECTOR_FIELD,
} from "../_shared/constants.mjs";
import { readEsAgentEnv } from "../_shared/env.mjs";

const ROWS = [
  {
    id: "life_01",
    note_title: "冰箱除霜后密封条老化",
    note_body:
      "上周断电除霜完发现冷藏室门封条闭合不紧，夹一张A4纸能轻松抽出来；淘宝买了同型号磁吸条，拆旧的时候记得从四角撬别硬扯，装完用吹风机热风档吹一圈定型。",
    tags: ["家务", "维修"],
    mood: "折腾",
    priority: 2,
  },
  {
    id: "life_02",
    note_title: "地铁通勤耳机降噪设置",
    note_body:
      "早高峰二号线轨道噪音集中在低频，把EQ里100Hz往下拉3dB，人声反而清楚多了；通透模式别全开，不然报站声和旁边大爷外放短视频会同时轰炸。",
    tags: ["数码", "通勤"],
    mood: "专注",
    priority: 1,
  },
  {
    id: "life_03",
    note_title: "换季衣柜樟脑丸别直接扔",
    note_body:
      "去年羊毛衫直接贴着樟脑丸放，今年拿出来一股刺鼻味散不掉；改用无纺布小包挂在衣杆上，羊绒大衣套透气防尘袋，底层抽屉铺一层雪梨纸吸潮。",
    tags: ["家务", "收纳"],
    mood: "碎碎念",
    priority: 1,
  },
  {
    id: "life_04",
    note_title: "周末晨跑膝盖微疼调整",
    note_body:
      "水泥路面跑了两周右膝外侧有点紧，改成塑胶跑道逆时针跑，步频提到170以上减小触地时间；跑完用泡沫轴滚大腿外侧和臀部，冰敷十分钟比热敷管用。",
    tags: ["运动", "健康"],
    mood: "警觉",
    priority: 2,
  },
  {
    id: "life_05",
    note_title: "投影仪侧投梯形校正",
    note_body:
      "卧室床头柜偏右放，画面左边高右边低，自动校正后文字还是有点虚；进设置手动四点校正，把左上角和右上角往内压两格，再开一点锐化，字幕终于不糊了。",
    tags: ["数码", "影音"],
    mood: "琢磨",
    priority: 2,
  },
  {
    id: "life_06",
    note_title: "菜市场挑鲈鱼看三点",
    note_body:
      "鱼眼要清澈凸出别买浑浊塌陷的；掀开鳃盖鲜红带血才是刚上岸，暗红发白的别要；按鱼身回弹快说明肉质紧，软塌塌的可能是反复解冻的。",
    tags: ["下厨", "买菜"],
    mood: "馋",
    priority: 1,
  },
  {
    id: "life_07",
    note_title: "信用卡账单日修改备忘",
    note_body:
      "原先账单日5号工资还没到账，打客服电话改成25号，注意一年只能改一次；改完后本月会出一份短账单，下月起按新周期走，设日历提醒别漏了首期还款。",
    tags: ["财务", "琐事"],
    mood: "谨慎",
    priority: 3,
  },
  {
    id: "life_08",
    note_title: "雨天玄关除湿小办法",
    note_body:
      "黄梅天鞋底带水踩得入户垫发臭，旧报纸铺在最底层吸湿，上面再铺硅藻土垫；伞架换成带沥水盘的，长柄伞头朝下别戳到墙布，每天开窗对流两小时。",
    tags: ["家务", "防潮"],
    mood: "无奈",
    priority: 1,
  },
  {
    id: "life_09",
    note_title: "深夜加班后入睡仪式",
    note_body:
      "对着屏幕太久大脑皮层还兴奋，十一点关大灯只留暖光台灯，冲澡水温比体温稍低；躺床上用4-7-8呼吸法，吸气四秒憋七秒吐八秒，通常三轮后眼皮开始沉。",
    tags: ["情绪", "睡眠"],
    mood: "飘",
    priority: 2,
  },
  {
    id: "life_10",
    note_title: "自驾短途后备厢清单",
    note_body:
      "折叠露营椅两把、保温箱里放冰袋和三瓶水、充气泵检查过胎压预设值2.3bar；备用手机支架贴在副驾出风口，主驾导航别用中控大屏反光严重。",
    tags: ["出行", "自驾"],
    mood: "放松",
    priority: 2,
  },
];

const { apiKey, baseUrl } = readEsAgentEnv(["apiKey", "baseUrl"]);

const embeddings = new OpenAIEmbeddings({
  apiKey,
  model: "text-embedding-v3",
  configuration: {
    baseURL: baseUrl,
  },
});

const milvusClient = new MilvusClient({
  address: MILVUS_ADDRESS,
});

/**
 * 重建 ES 索引并 bulk 写入
 */
async function seedElasticsearch(indexName, rows) {
  try {
    console.log("\n[Elasticsearch]");
    const client = new Client({ node: ES_NODE });

    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
      console.log("删除已有索引...");
      await client.indices.delete({ index: indexName });
      console.log("✓ 已删除");
    }

    console.log("创建索引与 mapping...");
    await client.indices.create({
      index: indexName,
      mappings: {
        properties: {
          note_title: {
            type: "text",
            analyzer: "ik_max_word",
            search_analyzer: "ik_smart",
          },
          note_body: {
            type: "text",
            analyzer: "ik_max_word",
            search_analyzer: "ik_smart",
          },
          tags: { type: "keyword" },
          mood: { type: "keyword" },
          priority: { type: "integer" },
          created_at: { type: "date" },
          updated_at: { type: "date" },
        },
      },
    });
    console.log("✓ 索引创建成功");

    const now = new Date().toISOString();
    console.log(`写入 ${rows.length} 条文档...`);
    await client.bulk({
      refresh: true,
      operations: rows.flatMap((row) => {
        const { id, ...rest } = row;
        return [
          { index: { _index: indexName, _id: id } },
          { ...rest, created_at: now, updated_at: now },
        ];
      }),
    });
    console.log("✓ ES 写入完成");
  } catch (error) {
    console.error("Elasticsearch 出错:", error.message);
    throw error;
  }
}

/**
 * 若集合已存在则删掉；创建集合、索引，加载后再插入向量数据
 */
async function seedMilvus(collectionName, rows, emb) {
  try {
    console.log("\n[Milvus]");

    const texts = rows.map((row) => `${row.note_title}\n${row.note_body}`);
    console.log("生成向量嵌入...");
    const vectors = await emb.embedDocuments(texts);
    const dim = vectors[0].length;

    const hasCollection = await milvusClient.hasCollection({
      collection_name: collectionName,
    });
    if (hasCollection.value) {
      console.log("删除已有集合...");
      await milvusClient.dropCollection({ collection_name: collectionName });
      console.log("✓ 已删除");
    }

    console.log("创建集合...");
    await milvusClient.createCollection({
      collection_name: collectionName,
      fields: [
        { name: "id", data_type: DataType.VarChar, max_length: 100 },
        {
          name: "note_title",
          data_type: DataType.VarChar,
          max_length: 512,
        },
        {
          name: "note_body",
          data_type: DataType.VarChar,
          max_length: 4096,
        },
        { name: "mood", data_type: DataType.VarChar, max_length: 64 },
        {
          name: "priority",
          data_type: DataType.VarChar,
          max_length: 16,
        },
        { name: "tags", data_type: DataType.VarChar, max_length: 256 },
        {
          name: "langchain_primaryid",
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true,
        },
        {
          name: MILVUS_TEXT_FIELD,
          data_type: DataType.VarChar,
          max_length: 10000,
        },
        {
          name: MILVUS_VECTOR_FIELD,
          data_type: DataType.FloatVector,
          dim,
        },
      ],
    });
    console.log("✓ 集合创建成功");

    console.log("创建向量索引...");
    await milvusClient.createIndex({
      collection_name: collectionName,
      field_name: EMBEDDING,
      index_type: IndexType.HNSW,
      metric_type: MetricType.L2,
      params: { M: 8, efConstruction: 64 },
    });
    console.log("✓ 索引创建成功");

    try {
      await milvusClient.loadCollection({ collection_name: collectionName });
      console.log("✓ 集合已加载");
    } catch {
      console.log("✓ 集合已处于加载状态");
    }

    console.log(`插入 ${rows.length} 条...`);
    const insertData = rows.map((row, i) => ({
      id: row.id,
      note_title: row.note_title,
      note_body: row.note_body,
      mood: row.mood,
      priority: String(row.priority),
      tags: row.tags.join(","),
      [MILVUS_TEXT_FIELD]: texts[i],
      [MILVUS_VECTOR_FIELD]: vectors[i],
    }));

    const insertResult = await milvusClient.insert({
      collection_name: collectionName,
      data: insertData,
    });

    await milvusClient.flushSync({ collection_names: [collectionName] });

    const cnt = Number(insertResult.insert_cnt) || rows.length;
    console.log(`✓ Milvus 写入完成（insert_cnt: ${cnt}）`);
  } catch (error) {
    console.error("Milvus 出错:", error.message);
    throw error;
  }
}

/**
 * 主入口
 */
async function main() {
  try {
    console.log("\n连接 Milvus...");
    await milvusClient.connectPromise;
    console.log("✓ 已连接");

    await seedElasticsearch(HYBRID_INDEX_NAME, ROWS);
    await seedMilvus(HYBRID_INDEX_NAME, ROWS, embeddings);
  } catch (error) {
    console.error("\n错误:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
