# Lesson 40 复习记录

## 这节课要解决什么问题

前面的 Agent 课程已经涉及模型调用、工具循环、RAG 和记忆，但模型本身仍像黑盒。本课建立一个足够用于开发和面试的底层模型：LLM 根据已有上下文预测后续 Token；Agent 通过循环补充上下文，推动模型持续决策。

## 文章主线与配图对应

| 顺序 | 知识点 | 配图 |
| --- | --- | --- |
| 1 | Agent 的感知、记忆、规划、行动循环 | `assets/01-agent-overview.png` |
| 2 | 训练阶段通过文本规律学习下一 Token | `assets/02-next-token-training-inference.jpeg` |
| 3 | 上下文由 Prompt、历史、工具、检索和用户画像组成 | `assets/03-context-is-input.png` |
| 4 | 三类 Transformer 架构 | `assets/04-transformer-architectures.png` |
| 5 | 生成任务中的因果掩码与双向注意力对比 | `assets/05-causal-vs-bidirectional-generation.png` |
| 6 | 理解任务中的双向与单向注意力对比 | `assets/06-causal-vs-bidirectional-understanding.png` |
| 7 | Decoder 生成与 Encoder 检索共同支撑 Agent/RAG | `assets/07-agent-rag-workflow.png` |
| 8 | 文本到 Token ID、Embedding 和位置表示 | `assets/08-tokenization-pipeline.png` |
| 9 | Decoder 层、隐藏状态和下一 Token 概率 | `assets/09-decoder-generation-pipeline.png` |
| 10 | 输出投影把隐藏状态变成 logits，Softmax 转成概率 | `assets/10-output-projection-softmax.png` |
| 11 | 自回归生成：把新 Token 追加回上下文 | `assets/11-autoregressive-generation.png` |
| 12 | 预训练与推理阶段的计算差异 | `assets/12-training-vs-inference.png` |

## 核心概念

### LLM 与 Agent

LLM 的基础任务可以抽象为：给定已有上下文，估计下一个 Token 的概率分布。Agent 并没有脱离这个机制，它把工具调用结果、检索片段、历史消息和状态继续放回上下文，让模型在新的上下文上做下一轮决策。

### Transformer 的三种形态

- **Encoder-only**：通常使用双向注意力，适合理解整段输入，常见用途包括文本表示、Embedding、分类和重排。
- **Decoder-only**：使用因果掩码，只读取当前位置之前的 Token，适合自回归生成，是当前通用对话模型和 Agent 的主流形态。
- **Encoder-Decoder**：Encoder 编码输入，Decoder 根据编码结果生成输出，适合经典的序列到序列任务，如翻译和摘要。

这里的“适合”表示典型用途，不是模型能力的绝对限制。具体模型的架构和训练目标应以官方资料为准。

### 文本如何变成模型输入

1. Tokenizer 将文本拆成 Token。Token 可能是词、子词、字符或其他片段，不等于自然语言中的完整词。
2. 词表为每个 Token 分配整数 ID。
3. Embedding 矩阵把 Token ID 映射到向量。
4. 模型加入位置信息，使注意力层能够区分顺序。传统实现可以把位置向量与 Token Embedding 相加，现代模型也常使用 RoPE 等方案。
5. 得到的向量序列进入多层 Transformer。

### 隐藏状态、logits 与 Softmax

Decoder 最后一层输出每个位置的隐藏状态。输出投影把目标位置的隐藏状态映射到词表大小的 logits；Softmax 把 logits 转成概率分布；解码策略再从分布中选择下一个 Token。选择不一定是简单的最大概率，还可能使用 temperature、top-k 或 top-p 等采样策略。

### 训练阶段与推理阶段

- 预训练使用大量文本执行自监督的下一 Token 预测，通过损失函数和反向传播更新参数。
- 推理阶段加载已经训练好的参数，只做前向计算和自回归生成，不通过一次普通对话自动更新权重。
- Agent 的历史消息、工具输出、检索结果和记忆属于输入上下文，不等于写入模型参数。

## 面试口述版

**问：LLM 的本质是什么？**

答：在给定上下文的条件下预测下一个 Token 的概率分布，并通过自回归循环逐步生成序列。

**问：Agent 和 LLM 的关系是什么？**

答：Agent 负责循环编排和状态更新，把用户输入、工具结果、检索内容和记忆补充进上下文，再调用 LLM 继续决策。

**问：为什么对话模型通常使用 Decoder-only？**

答：对话和代码生成需要按顺序生成内容，因果掩码保证当前位置只能看前文，训练目标和推理过程一致，适合自回归生成。

**问：RAG 中 Encoder 和 Decoder 如何配合？**

答：Encoder 类模型通常负责把文本映射为向量并做相似度匹配或重排，Decoder 类模型读取用户问题和检索片段，负责组织答案或继续调用工具。

**问：一次普通对话会训练模型吗？**

答：普通推理只进行前向计算，不会直接更新模型权重；对话内容可能被应用层保存为历史或记忆，随后作为上下文再次提供给模型。

## 文章表述的复习修正

文章为了帮助入门使用了若干绝对化说法，复习时按下面的边界理解：

- “预测下一个词”应理解为“预测下一个 Token”。
- 不能简单说 Encoder 只能理解、Decoder 只能生成；应说明它们的典型架构和常见用途。
- 双向注意力不是“无法学习规律”，而是允许位置利用更完整的上下文；具体训练目标决定模型如何学习。
- 位置编码不只有与 Embedding 相加一种实现，RoPE 等相对位置方案也很常见。
- 推理阶段通常不更新权重，但模型仍可由后续训练、微调或参数更新产生新版本。

## 复习边界

本课是理论课程，没有新增可运行代码，也没有声明可以直接观察真实模型内部的所有中间张量。想继续深入时，可以在已有 RAG、Agent 和模型调用课程中对照观察 Tokenizer、Embedding、上下文拼接和生成调用；这些实验需要对应模型 API 或本地模型工具。
