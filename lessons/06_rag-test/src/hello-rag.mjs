import "@lessons/shared/env-loader";
import { createChatModel, createEmbeddings } from "@lessons/shared/model";
// ChatOpenAI 负责思考，OpenAIEmbeddings 负责将文字转为数学向量
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

/**
 *
 * RAG 是什么？
 * RAG（Retrieval-Augmented Generation）：检索增强生成，是一种让 AI 结合外部知识库来回答问题的技术。
 * 它通过“看书考试”的方式，让 AI 变得更“博学”。
 * 具体来说，RAG 会：
 * 1. 把文档转换成向量（数学表示），存到“仓库”里。
 * 2. 当用户提问时，AI 先去仓库里找和问题最像的文档片段。
 * 3. 把这些片段喂给 AI，让它“看书考试”，回答问题。
 * 4. 最后，AI 结合自己的知识，给出最终答案。

 * 【核心流程：RAG 三步走】
 * 1. Indexing (索引): 将文档转换成向量并存储。
 * 2. Retrieval (检索): 根据用户问题，去仓库里找最像的文档片段。
 * 3. Generation (生成): 把片段喂给 AI，让它“看书考试”。

 * 总结：两者的完美结合
    在实际的企业级应用中，通常会同时使用 RAG 和 MCP：
    RAG 负责从海量文档（如 PDF、Wiki）中捞出相关的背景知识。
    MCP 负责让 AI 操作实时系统（如查询数据库、修改权限、发送邮件）。
    一句话理解： RAG 让 AI 变得“博学”，MCP 让 AI 变得“能干”
 */

// 1. 初始化 Chat 模型（deepai 代理）
const model = createChatModel();

// 2. 初始化 Embedding 模型（DashScope，与 Chat 分开配置）
const embeddings = createEmbeddings();

// 3. 准备私有数据：Document 对象包含内容 (pageContent) 和 属性 (metadata)

const documents = [
  new Document({
    pageContent: `小明是一个活泼开朗的小男孩，他有一双明亮的大眼睛，总是带着灿烂的笑容。小明最喜欢的事情就是和朋友们一起玩耍，他特别擅长踢足球，每次在球场上奔跑时，就像一道阳光一样充满活力。`,
    metadata: {
      chapter: 1,
      character: "小明",
      type: "角色介绍",
      mood: "活泼",
    },
  }),
  new Document({
    pageContent: `东东是小明最好的朋友，他是一个安静而聪明的男孩。东东喜欢读书和画画，他的画总是充满了想象力。虽然性格不同，但东东和小明从幼儿园就认识了，他们一起度过了无数个快乐的时光。`,
    metadata: {
      chapter: 2,
      character: "东东",
      type: "角色介绍",
      mood: "温馨",
    },
  }),
  new Document({
    pageContent: `有一天，学校要举办一场足球比赛，小明非常兴奋，他邀请东东一起参加。但是东东从来没有踢过足球，他担心自己会拖累小明。小明看出了东东的担忧，他拍着东东的肩膀说："没关系，我们一起练习，我相信你一定能行的！"`,
    metadata: {
      chapter: 3,
      character: "小明和东东",
      type: "友情情节",
      mood: "鼓励",
    },
  }),
  new Document({
    pageContent: `接下来的日子里，小明每天放学后都会教东东踢足球。小明耐心地教东东如何控球、传球和射门，而东东虽然一开始总是踢不好，但他从不放弃。东东也用自己的方式回报小明，他画了一幅画送给小明，画上是两个小男孩在球场上一起踢球的场景。`,
    metadata: {
      chapter: 4,
      character: "小明和东东",
      type: "友情情节",
      mood: "互助",
    },
  }),
  new Document({
    pageContent: `比赛那天终于到了，小明和东东一起站在球场上。虽然东东的技术还不够熟练，但他非常努力，而且他用自己的观察力帮助小明找到了对手的弱点。在关键时刻，东东传出了一个漂亮的球，小明接球后射门得分！他们赢得了比赛，更重要的是，他们的友谊变得更加深厚了。`,
    metadata: {
      chapter: 5,
      character: "小明和东东",
      type: "高潮转折",
      mood: "激动",
    },
  }),
  new Document({
    pageContent: `从那以后，小明和东东成为了学校里最要好的朋友。小明教东东运动，东东教小明画画，他们互相学习，共同成长。每当有人问起他们的友谊，他们总是笑着说："真正的朋友就是互相帮助，一起变得更好的人！"`,
    metadata: {
      chapter: 6,
      character: "小明和东东",
      type: "结局",
      mood: "欢乐",
    },
  }),
  new Document({
    pageContent: `多年后，小明成为了一名职业足球运动员，而东东成为了一名优秀的插画师。虽然他们走上了不同的道路，但他们的友谊从未改变。东东为小明设计了球衣上的图案，小明在每场比赛后都会给东东打电话分享喜悦。他们证明了，真正的友情可以跨越时间和距离，永远闪闪发光。`,
    metadata: {
      chapter: 7,
      character: "小明和东东",
      type: "尾声",
      mood: "温馨",
    },
  }),
];

// 4. 向量化存储：使用 MemoryVectorStore 在内存中建立索引
// 知识点：向量化是通过计算“余弦相似度”来寻找语义相近的内容，而不是简单的关键词匹配
const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings,
);

// 5. 执行检索
const question = "东东和小明是怎么成为朋友的？";
const retriever = vectorStore.asRetriever({ k: 3 }); // 指定只取最相关的 3 个片段

// 6. 获取文档
const retrievedDocs = await retriever.invoke(question);

// 7.使用 similaritySearchWithScore 获取相似度评分
const scoredResults = await vectorStore.similaritySearchWithScore(question, 3);

// 问题是：实际上知识的来源可能有很多：一个 word 文档、一个 pdf 文件、一个 youtube 视频、一个 url、一个 x 的推文等。
// 如何将这些不同的知识来源转换成统一的格式，然后存储到向量数据库中？
// 答案是：要用各种 loader 来转换，对应的 loader 处理后，变成 Document，之后再由嵌入模型向量化后存入知识库。
// 详见：./loader-and-splitter.mjs

// 8. 打印用到的文档和相似度评分
console.log("\n【检索到的文档及相似度评分】");
retrievedDocs.forEach((doc, i) => {
  // 找到对应的评分
  const scoredResult = scoredResults.find(
    ([scoredDoc]) => scoredDoc.pageContent === doc.pageContent,
  );
  const score = scoredResult ? scoredResult[1] : null;
  const similarity = score !== null ? (1 - score).toFixed(4) : "N/A";
  console.log(`\n[文档 ${i + 1}] 相似度: ${similarity}`);
  console.log(`内容: ${doc.pageContent}`);
  console.log(
    `元数据: 章节=${doc.metadata.chapter}, 角色=${doc.metadata.character}, 类型=${doc.metadata.type}, 心情=${doc.metadata.mood}`,
  );
});

// 9. 构建 prompt
const context = retrievedDocs
  .map((doc, i) => `[片段${i + 1}]\n${doc.pageContent}`)
  .join("\n\n━━━━━\n\n");

const prompt = `你是一个讲友情故事的老师。基于以下故事片段回答问题，用温暖生动的语言。如果故事中没有提到，就说"这个故事里还没有提到这个细节"。

故事片段:
${context}

问题: ${question}

老师的回答:`;

// 10. 打印 AI 回答
console.log("\n【AI 回答】");
const response = await model.invoke(prompt);
console.log(response.content);
console.log("\n");


/* 
  总结：基于 LangChain 写 RAG 的代码：
    1. fromDocuments api 基于 embeddings 模型把文档向量化存入数据库。
    2. 使用 asRetriever 指定查询相似度最大的几个文档。
    3. 使用 similaritySearchWithScore 相似度评分。
    4. 使用 retriever.invoke 来查询文档。
 */


