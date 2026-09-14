# Lesson 41 复习记录

## 这节课要解决什么问题

第 40 课已经说明 Decoder-only Transformer 负责自回归生成。本课继续往 Decoder 层内部深入，解释每个 Token 如何通过 Q、K、V 自注意力吸收上下文，为什么还需要 FFN，模型如何把隐藏状态映射成概率，以及 KV Cache 和采样策略怎样影响推理速度与输出风格。

## 文章主线与配图对应

| 顺序 | 知识点 | 配图 |
| --- | --- | --- |
| 1 | QKV 注意力在 Transformer 和 Agent 中的位置 | `assets/01-qkv-attention-overview.png` |
| 2 | Q、K、V 的职责 | `assets/02-qkv-query-key-value.jpeg` |
| 3 | QK 打分、权重归一化和 V 加权 | `assets/03-attention-weighted-values.png` |
| 4 | 注意力之后的 FFN 和输出投影 | `assets/04-ffn-and-output-projection.png` |
| 5 | 从 FFN 到下一个 Token | `assets/05-decoder-generation-chain.jpeg` |
| 6 | KV Cache 的目的 | `assets/06-kv-cache-overview.png` |
| 7 | KV Cache 在逐 Token 生成中的更新 | `assets/07-kv-cache-step-by-step.png` |
| 8 | QKV、FFN 和 Softmax 的批量计算适合 GPU | `assets/08-gpu-parallel-computation.jpeg` |
| 9 | 训练中的数据集、损失和反向传播 | `assets/09-training-dataset-loss-backprop.jpeg` |
| 10 | 从训练阶段到推理阶段 | `assets/10-training-to-inference-flow.png` |
| 11 | 采样策略总览 | `assets/11-sampling-strategies.png` |
| 12 | Greedy 贪心 | `assets/12-greedy-sampling.jpeg` |
| 13 | Top-K | `assets/13-top-k-sampling.png` |
| 14 | Top-P / Nucleus Sampling | `assets/14-top-p-sampling.jpeg` |
| 15 | Temperature | `assets/15-temperature-sampling.jpeg` |
| 16 | `ChatOpenAI` 的 `topP` 配置截图 | `assets/16-generation-controls.png` |
| 17 | 本课完整闭环 | `assets/17-course-summary.png` |

## Q、K、V 自注意力

对每个输入 Token 的表示，模型通过不同的线性变换得到三组向量：

- **Q（Query）** 表示当前位置想从上下文中检索什么信息。
- **K（Key）** 表示每个位置用于匹配的特征。
- **V（Value）** 承载该位置要被融合的内容。

当前位置的 Q 会与各位置的 K 计算相似度，经过缩放、掩码（Decoder 中使用因果掩码）和 Softmax 得到注意力权重，再用这些权重对各位置的 V 做加权求和。K 主要参与匹配分数计算，V 参与内容聚合；Q、K、V 都是同一层中间计算的一部分，不能把它们理解成三个独立模型。

常见的缩放点积注意力可以写成：

```text
Attention(Q, K, V) = softmax(mask(QKᵀ / √dₖ))V
```

多头注意力会在多个子空间分别计算这套过程，再拼接并投影结果。文章用单头示意图帮助理解，实际模型通常包含多个 attention head。

## FFN、输出投影与 Softmax

注意力把上下文信息聚合到当前位置后，FFN 通过带激活函数的非线性变换继续加工特征，帮助模型表达词汇搭配、语法和更高层规律。最后一层隐藏状态经过输出投影得到词表大小的 logits，再经 Softmax 得到概率分布。

Softmax 输出的是分布，不等于最终一定选择概率最大的 Token。解码器可以使用 Greedy、Top-K、Top-P、Temperature 等策略，具体选择由服务端或调用参数决定。

## KV Cache 为什么能加速推理

Decoder 推理分为两个容易混淆的阶段：

1. **Prefill**：第一次处理完整输入上下文，计算历史 Token 的 K、V，并把它们放入缓存。
2. **Decode**：每轮只追加一个新 Token。新位置需要计算自己的 Q、K、V，历史位置的 K、V 直接从缓存读取；新产生的 K、V 再追加进缓存。

KV Cache 减少了重复计算历史 K、V，但会占用显存，且缓存大小会随上下文长度和层数增长。它不是把模型参数缓存起来，也不会改变模型权重。

## GPU 与训练推理

QK 矩阵乘法、V 加权、FFN 和 Softmax 都包含大量向量与矩阵运算，GPU 擅长并行执行这些操作。训练阶段还要保存中间结果、计算损失并反向传播，通常比推理需要更多显存；推理阶段主要进行前向计算和自回归生成。

训练的抽象流程是：数据集 → Token 化 → 前向计算 → 损失 → 反向传播 → 参数更新。推理则是：上下文 → 前向计算 → 概率分布 → 采样 Token → 追加上下文并循环。一次普通 Agent 调用属于推理，不会直接更新模型权重。

## 采样策略对比

| 策略 | 处理方式 | 典型效果 |
| --- | --- | --- |
| Greedy | 每次选择当前概率最高的 Token | 稳定、可复现，但可能单调或重复 |
| Top-K | 只在概率最高的 K 个候选中采样 | 候选数量固定，稳定性和多样性可调 |
| Top-P | 从高概率开始累加，取达到 P 的动态候选集合 | 会随分布变化候选数量，常用于自然生成 |
| Temperature | 缩放 logits 的差异，再配合采样 | 低温更保守，高温更发散；不负责裁剪候选集合 |

Temperature 趋近 0 时常表现得接近 Greedy，但具体行为仍取决于实现。Top-K/Top-P 控制候选集合，Temperature 控制分布尖锐程度，三者可以组合使用。

## 图片中的代码片段

第 16 张图展示了 OpenAI 兼容聊天模型的采样参数配置，能确认的内容是：

```js
const model = new ChatOpenAI({
  temperature: 0,
  topP: 0.5,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});
```

图片没有给出完整文件、依赖版本、调用代码和服务端是否支持 `topP` 的信息，因此没有据此创建可运行脚本。复习时只把它当作“temperature / topP 如何传入模型客户端”的配置示意；具体 SDK 参数和兼容性应以当前使用的模型服务文档为准。

## 面试口述版

**问：Q、K、V 分别是什么？**

答：Q 表示当前位置的查询，K 用来和 Q 匹配计算相关性，V 携带被加权聚合的内容。注意力权重来自 QK 匹配，输出是对 V 的加权求和。

**问：KV Cache 缓存什么？**

答：缓存已经计算过的历史 Token 的 K、V。后续 Decode 只处理新增位置，并复用历史 K、V，从而减少重复计算；缓存会占用显存。

**问：Top-P 和 Top-K 的区别？**

答：Top-K 固定保留 K 个候选，Top-P 按累积概率动态确定候选数量，然后在候选集合内采样。

**问：Temperature 做什么？**

答：Temperature 缩放 logits，改变概率分布的尖锐程度。低温提高确定性，高温提高随机性；它本身不负责裁剪候选 Token。

## 文章表述的复习修正

- “逐字生成”应理解为逐 Token 生成，Token 可能是字、词、子词或其他片段。
- K 不只是“打分后完全没用”：在当前注意力计算中它用于生成权重，在缓存和后续计算中历史 K 仍会被复用。
- “所有 V 都参与”是加权求和的数学描述，实际权重可能很小；实现也可能使用稀疏或近似注意力。
- “概率最高就输出”只对应 Greedy；Top-K、Top-P 和 Temperature 会改变最终选择。
- GPU 并非模型运行的逻辑必需品，但大模型训练和高吞吐推理通常依赖 GPU 或其他高性能加速器。
- “所有生成式大模型都遵循同一流程”是教学抽象；不同模型可能使用 MoE、GQA、MQA、FlashAttention 或其他工程优化。

## 复习边界

本课没有可运行的训练代码或推理引擎。最小复习路径是先看配图，再结合第 40 课的 Token/Decoder 总览，最后用已有 Agent 和 RAG 课程理解上下文如何影响生成。要验证真实 KV Cache、GPU 显存和采样参数，需要具体模型服务或本地推理框架，当前项目未提供这些外部环境。
