# 公众号文章 + 代码文件整理规范

本文件只有在 `AGENT.md` 中“总结任务触发判断规则”的全部条件都满足后，才允许读取并执行。

当用户要求“总结”“整理”“结合文章整理代码”“方便后续复习”，且已通过 `AGENT.md` 的触发判断时，不要只输出普通摘要，而是按照下面流程执行。

---

## 目标

将公众号文章中的知识主线，与当前代码文件一一对齐，整理成后续可复习、可运行、可扩展的学习代码包。

整理重点不是大改业务逻辑，而是提升：

1. 代码学习顺序清晰度
2. 文件命名可读性
3. 注释解释价值
4. 示例之间的递进关系
5. 后续复习效率
6. 文章知识点和代码实现的对应关系
7. 学习代码包的最低可运行性

本规范适用于学习项目，不适用于生产级重构。所有整理都必须服务“后续复习”，不能为了工程化而工程化。

---

## 执行流程

### 1. 先阅读原文，提炼文章主线

先不要急着改代码，必须先梳理文章的学习路径。

需要识别：

* 文章从哪个问题开始讲
* 每一段代码示例解决了什么问题
* 示例之间是什么递进关系
* 哪些概念是核心概念
* 哪些代码只是演示，不应该过度封装
* 哪些结论需要在 README 中保留
* 哪些外部依赖可能阻塞本地复习

输出时要能回答：

> 这篇文章到底想教会我什么？

---

### 2. 再检查代码文件

检查当前代码是否和文章主线一致。

重点检查：

* 文件名是否能表达示例目的
* 示例顺序是否符合学习路径
* 是否有重复初始化模型、重复环境变量读取、重复 schema、重复 examples、重复 prompt block、重复工具函数
* 是否存在编号示例文件 import 另一个编号示例文件
* 是否存在文件名和实际内容不一致
* 是否有过时、误导、容易复习时混淆的注释
* 是否有运行方式不清晰的问题
* 是否有文章中提到但代码中缺失的关键示例
* 是否有 README 写了安装命令但缺少 `package.json`
* 是否有代码读取环境变量但 README 未说明这些变量来自根目录 `.env`
* 是否有外部服务依赖但没有 fallback 示例或 fallback 说明

---

### 3. 按学习顺序重排文件

如果当前文件较多，应按照文章递进顺序进行编号。

示例：

```txt
00-normal-json-fail.mjs
01-json-output-parser.mjs
02-structured-output-parser-basic.mjs
03-structured-output-parser-zod.mjs
04-tool-call-args.mjs
05-with-structured-output.mjs
06-stream-normal.mjs
07-stream-structured-output.mjs
08-stream-output-parser.mjs
09-stream-tool-calls-raw.mjs
10-stream-tool-calls-parser.mjs
11-xml-output-parser.mjs
```

编号规则：

* `00` 通常表示问题起点、失败示例、基础示例或对照组
* 后续编号表示解决方案递进
* 文件名必须体现“这个示例在讲什么”
* 不允许保留明显误导的文件名
* 不允许为了排序而破坏文章原本的学习递进关系
* 不允许删除文章中用于演示递进关系的代码

---

### 4. 抽离重复代码

如果多个示例重复出现模型初始化、环境变量读取、schema、examples、prompt block、工具函数，应抽离到 `_shared/` 目录。

推荐结构：

```txt
src/
  _shared/
    model.mjs
    schemas.mjs
    prompts.mjs
    examples.mjs
    utils.mjs
  00-xxx.mjs
  01-xxx.mjs
  02-xxx.mjs
```

抽离原则：

* 不要为了封装而封装
* 只抽离重复且与当前示例主线无关的代码
* 只抽离跨多个示例复用、但不应该放在编号示例文件中的代码
* 示例文件本身仍然要保持“打开就能看懂”
* 抽离后的公共文件必须加清晰注释
* 编号示例文件只能演示知识点，不能承担公共模块职责
* 不允许把所有逻辑都藏进 `_shared/`，导致示例文件失去学习价值

#### 4.1 抽离重复代码的强制验收标准

整理完成前，必须检查是否存在以下情况：

1. 模型初始化重复出现 2 次及以上
2. 环境变量读取重复出现 2 次及以上
3. schema 重复出现 2 次及以上
4. examples 重复出现 2 次及以上
5. prompt block 重复出现 2 次及以上
6. 工具函数重复出现 2 次及以上
7. 示例文件之间通过 import 某个编号示例文件来复用代码

如果存在以上情况，必须优先抽离到 `_shared/` 目录。

`_shared/` 目录不允许空置。  
如果判断确实不需要抽离，必须在最终输出中说明：

* 检查了哪些重复项
* 为什么不抽离
* 保留在示例文件中的原因

禁止通过“已按学习顺序整理”“README 已补充”“注释已添加”等理由跳过公共代码抽离。

#### 4.2 示例文件不能作为公共模块

编号示例文件，例如 `01-xxx.mjs`、`02-xxx.mjs`，只用于演示当前知识点。

禁止其他示例文件为了复用代码而 import 编号示例文件。

不允许：

```js
import { pipelinePrompt } from './01-pipeline-prompt-modules.mjs'
import { examples } from './08-fewshot-prompt-template.mjs'
```

允许：

```js
import { createModel } from './_shared/model.mjs'
import { pipelinePrompt } from './_shared/prompts.mjs'
import { examples } from './_shared/examples.mjs'
```

原因：

* 编号示例文件通常存在顶层演示逻辑
* 被其他文件 import 时，可能产生额外输出或副作用
* 复习时会混淆当前示例的执行流程
* 公共 prompt、schema、examples、model、工具函数必须进入 `_shared/`

如果某个编号示例文件被其他编号示例 import，必须改为从 `_shared/` import。

#### 4.3 可运行学习包最低文件要求

如果整理结果是一个可独立下载、后续复习的学习代码包，根目录必须检查并补充：

```txt
README.md
REVIEW_NOTES.md
package.json
src/
```

要求：

* 如果项目原本已有 `package.json`，可以更新而不是重建
* 如果缺少 `package.json`，必须补充最小依赖和基础脚本
* 如果代码依赖模型 API、数据库、Milvus、Docker、远程向量库或外部服务，必须在 README 中补充环境变量说明，并明确这些变量来自项目根目录 `.env`
* 不要为单个 lesson 额外生成环境变量示例文件；当前项目统一维护根目录 `.env`
* 禁止 README 中写了 `pnpm install`、`npm install` 或运行命令，但项目缺少 `package.json`
* 如果判断不需要 `package.json` 或 README 环境变量说明，必须在最终输出中说明原因

#### 4.4 lessons 子课程 Markdown 文件限制

`lessons/` 下的子课程包整理完成后，课程根目录只应保留两份 Markdown：

```txt
README.md
REVIEW_NOTES.md
```

规则：

* `README.md` 是快速入口，负责学习目标、运行方式、依赖分类和复习路径。
* `REVIEW_NOTES.md` 是完整复习记录，负责文章主线、代码对应关系、整理原因、自检结果和后续注意。
* `LESSON.md`、`NOTES.md`、`SUMMARY.md` 等讲义或总结文件的有效内容必须合并进 `REVIEW_NOTES.md` 后再删除。
* 不允许课程根目录长期同时保留 `README.md`、`REVIEW_NOTES.md` 和 `LESSON.md` 三份复习文档。

范围：

* 本限制只约束可复习课程包根目录。
* 排除 `lessons/_shared/`、生成目录、vendor 目录、嵌套 demo app、临时实验目录和未被本轮指定为课程根的辅助资料目录。
* 如果某个 lesson 的真实课程根位于子目录，例如 `lessons/17_nest+langchain/hello-nest-langchain/`，则以真实课程根为准。
* 如果本轮只要求检查，不要求整理其他课程，只报告不合规目录，不自动删除或合并。

#### 4.5 lessons 子课程依赖安装限制

`lessons/` 下的子课程禁止单独下载和维护 `node_modules`。依赖安装和升级必须优先在项目根目录执行，复用根目录 `node_modules`。

规则：

* 不要在 `lessons/*` 或 `lessons/*/*` 内执行 `pnpm install`、`npm install`、`yarn install` 或类似会生成子目录 `node_modules` 的命令。
* 如果子课程需要新增依赖，优先在项目根目录 `D:\1project\agent` 更新根 `package.json` 和根锁文件。
* 子课程代码应优先依赖项目根目录已有依赖；不要为了单个 lesson 在子课程目录重复下载同一依赖。
* 如果脚手架、CLI 或生成器自动在子课程目录安装依赖，完成后必须删除该子课程下的 `node_modules`，并把实际需要的依赖补到根目录。
* 如果确实存在必须独立安装的例外，必须先在最终输出中说明原因、影响范围和清理方式，不能默认执行。

交付前必须检查：

* 本轮涉及的子课程目录下是否产生了 `node_modules`。
* 新增依赖是否写入根 `package.json`，而不是只写入子课程 `package.json`。
* 根锁文件是否同步更新。

---

### 5. 调整注释风格

本步骤是必做项。

注释要服务复习，而不是重复代码。

推荐注释内容：

* 这个示例解决什么问题
* 这个示例对应文章中的哪个知识点
* 为什么这里使用当前 API
* 这个 API 的适用场景是什么
* 这个示例和前一个示例相比，多了什么
* 当前方案的局限是什么
* 当前示例是否依赖 API Key、数据库、Milvus、Docker 或外部服务

避免：

* 对每一行代码做机械翻译
* 写“导入 xxx”“定义变量 xxx”这类低价值注释
* 加太长的理论说明，影响代码阅读
* 把 README 级别的大段理论塞进每个示例文件

每个核心示例文件至少应有一段复习型注释，说明：

* 这个示例解决的问题
* 当前 API 的适用场景
* 和前一个示例相比新增了什么
* 当前方案的局限或依赖条件

如果示例文件非常短，也可以只保留 1-2 句高价值复习注释，但不能完全没有复习入口。

---

### 6. 补充 README.md

必须生成或更新 README.md。

README 至少包含：

* 当前代码包学习目标
* 文章主线和代码文件的对应关系
* 文件运行顺序
* 每个示例对应的知识点
* 推荐运行命令
* 关键结论
* 常见报错说明
* 后续复习建议
* 外部依赖说明
* fallback 复习路径

README 的目标是：

> 用户隔一周回来，也能知道应该从哪个文件开始看、哪些文件可以直接跑、哪些文件需要配置环境。

#### 6.1 README 运行说明必须按依赖强度分组

README 的运行说明必须按依赖强度分组，不能把语法检查和实际运行命令混在一起。

推荐分组：

1. 语法检查
2. 无需 API Key 可运行
3. 需要模型 API
4. 需要外部服务，例如 Milvus / Docker / 数据库
5. fallback 复习路径

每个示例文件应标注：

* 学习目的
* 是否需要 API Key
* 是否需要外部服务
* 推荐运行命令
* 常见失败原因

#### 6.2 补充外部依赖 fallback

当文章或代码示例依赖 Milvus、Docker、远程向量库、数据库、外部 API 等容易阻塞本地复习的服务时，必须补充 fallback 说明或 fallback 示例。

fallback 要求：

* README 中必须说明原方案依赖什么、失败时会出现什么现象、如何降级复习
* 代码包中应优先提供一个可直接运行的 fallback 示例
* fallback 不要求达到生产效果，但必须保留核心学习链路
* 如果是 Milvus / 向量库场景，fallback 示例至少要演示“选择示例 -> 组装 prompt”的完整流程
* 不允许只写“后续再补”或让用户自己猜替代方案
* 如果暂时无法补 fallback，必须说明原因和最小替代复习路径

---

### 7. 补充 REVIEW_NOTES.md

如果用户明确说“后续复习”“代码层面和可阅读性层面”“学习代码包整理”，默认需要生成或更新 `REVIEW_NOTES.md`。

内容包括：

* 本次整理做了哪些事情
* 为什么这么改
* 哪些地方只是命名调整
* 哪些地方是结构调整
* 哪些地方是为了降低复习成本
* 哪些公共代码被抽离到 `_shared/`
* 哪些文件可以无需 API Key 复习
* 哪些文件需要模型 API
* 哪些文件需要外部服务
* fallback 路径是什么
* 哪些坑点后续要注意

如果当前 lesson 不是多个编号示例文件，而是一个单独 Nest 应用、单独入口文件或单项目式代码包，也必须在 `REVIEW_NOTES.md` 中写清楚推荐复习顺序，不能因为文件没有编号就省略。

这类项目的复习顺序应按模块和调用链组织，例如：

1. 先看入口和根模块：`main.ts`、`app.module.ts`，理解应用如何启动、全局模块如何注册。
2. 再看核心业务模块：按 `module -> controller -> service` 顺序理解请求入口、依赖注入和业务流。
3. 再看共享能力或工具模块：例如模型 provider、工具 provider、配置读取、数据库实体、定时任务模块。
4. 最后看运行和验证路径：环境变量、外部服务依赖、fallback、常见报错和最小可运行命令。

`REVIEW_NOTES.md` 中应明确说明：该 lesson 没有编号示例文件，因此复习顺序以 Nest 模块依赖关系、请求调用链和运行依赖为主线。

---

### 8. 保留原文知识结论

不要只改代码，还要把文章里的关键判断沉淀下来。

README 或 REVIEW_NOTES 中需要保留文章的核心判断，例如：

* 普通 JSON Prompt 不可靠，可能返回 Markdown 包裹
* JsonOutputParser 可以解析常见 JSON 包裹情况
* StructuredOutputParser 可以生成格式提示词
* Zod Schema 更适合复杂结构
* Tool Calls 做结构化输出更可靠
* withStructuredOutput 是常用入口
* 流式打印场景下，Output Parser 仍然有价值
* Tool Call Chunks 可以实现工具参数的流式观察
* XML/YAML 等非 JSON 格式仍需要 Output Parser
* PromptTemplate / ChatPromptTemplate / FewShotPromptTemplate / ExampleSelector 等 API 的适用边界

以上只是示例，不要求照抄。必须根据当前公众号文章的实际内容沉淀对应结论。

---

### 9. 不要过度工程化

这是学习项目，不是生产项目。

禁止：

* 引入复杂框架
* 大规模改变运行方式
* 把简单示例封装得看不懂
* 把所有逻辑都抽成工具函数
* 删除文章中用于演示递进关系的代码
* 为了“看起来工程化”而牺牲单个示例文件的可读性
* 用编号示例文件承担公共模块职责

允许：

* 改文件名
* 调整目录
* 抽离重复模型初始化
* 抽离重复环境变量读取
* 抽离重复 schema
* 抽离重复 examples
* 抽离重复 prompt block
* 增加 README
* 增加 REVIEW_NOTES
* 增加 README 环境变量说明，指向项目根目录 `.env`
* 增加最小 `package.json`
* 增加 fallback 示例

必须：

* 添加复习型注释
* 在存在外部服务依赖时，增加 fallback 说明或 fallback 示例
* 保证 README 中的运行命令和项目文件匹配
* 保证可运行学习包具备最低运行文件
* 最终输出交付前自检结果

---

## 交付前自检清单

在最终输出前，必须完成以下检查，并在最终回复中给出检查结果。

### 1. 结构检查

必须检查：

* `_shared/` 是否为空
* lessons 子课程根目录是否只保留 `README.md` 和 `REVIEW_NOTES.md`
* 本轮涉及的 lessons 子课程目录是否不存在独立 `node_modules`
* 如果 lesson 是单独 Nest 应用、单独入口文件或单项目式代码包，`REVIEW_NOTES.md` 是否已经写明推荐复习顺序
* 是否存在编号示例文件 import 另一个编号示例文件
* 是否存在重复模型初始化
* 是否存在重复环境变量读取
* 是否存在重复 schema / examples / prompt block
* 是否存在 README 写了安装命令但缺少 `package.json`
* 是否存在代码读取环境变量但 README 未说明这些变量来自根目录 `.env`
* 是否存在外部服务依赖但缺少 fallback 示例或 fallback 说明

### 2. 运行检查

必须至少执行：

```bash
node --check src/**/*.mjs
```

如果当前 shell 不支持 glob，必须逐个执行：

```bash
node --check src/00-xxx.mjs
node --check src/01-xxx.mjs
node --check src/_shared/xxx.mjs
```

如果无法执行，必须说明原因，不能直接写“已检查”。

### 3. import 检查

必须确认不存在类似：

```js
import { xxx } from './01-xxx.mjs'
import { xxx } from './02-xxx.mjs'
```

如需复用，必须改为：

```js
import { xxx } from './_shared/xxx.mjs'
```

如果保留编号示例之间的 import，必须明确说明为什么不会产生副作用；但默认不允许保留。

### 4. 依赖分类检查

README 必须明确列出：

* 无需 API Key 可运行的文件
* 需要模型 API 的文件
* 需要 Milvus / Docker / 数据库等外部服务的文件
* fallback 文件

### 5. 格式检查

必须检查并修复：

* `from'xxx'`
* `from"xxx"`
* 明显缺少空格导致的语法错误，例如 `awaitPromise.all`、`return0`
* 未使用 import
* 未使用变量
* 明显混乱的缩进
* 明显和 README 不一致的环境变量名或 collection name

### 6. 最终输出必须包含自检结果

最终输出除了目录结构和修改说明，还必须包含：

* `_shared/` 抽离结果
* lessons 子课程根目录 Markdown 文件检查结果
* lessons 子课程依赖是否安装在根目录、是否残留子目录 `node_modules`
* 编号示例 import 检查结果
* `node --check` 检查结果
* README 依赖分类结果
* `package.json` / README 环境变量说明是否补齐
* fallback 是否补齐
* 如果某项未完成，必须明确说明原因

---

## 最终交付要求

整理完成后，需要输出：

1. 整理后的目录结构
2. 修改点说明
3. 每个示例文件的学习目的
4. 新增或修改的 README / REVIEW_NOTES
5. `_shared/` 抽离结果
6. lessons 子课程根目录 Markdown 文件检查结果
7. lessons 子课程依赖是否安装在根目录、是否残留子目录 `node_modules`
8. 编号示例 import 检查结果
9. 运行检查结果，例如 `node --check`
10. README 中的依赖分类结果
11. `package.json` / README 环境变量说明是否补齐
12. fallback 是否补齐
13. 如果有压缩包，说明压缩包内包含哪些内容
14. 如果发现文章或代码存在不一致，需要明确指出
15. 如果某项无法完成，必须说明原因，不能假装完成

---

## 用户只说“总结”时的默认行为

如果用户只说：

> 总结一下  
> 帮我整理一下  
> 结合文章整理代码  
> 方便后续复习

不能直接默认执行完整整理流程。必须先回到 `AGENT.md` 的“总结任务触发判断规则”，确认全部条件满足：

1. 当前目录位于 `agent/` 项目内
2. 用户提供或明确指定了公众号 `.txt` 原文
3. 存在对应代码文件
4. 用户用途是后续复习或学习代码包整理

只有全部满足时，才执行本文件定义的完整整理流程；否则按普通总结、代码分析、报错排查或一般说明处理。

---

## 优先级说明

执行本规范时，优先级如下：

1. 当前项目的 `AGENT.md` / 项目规则
2. 用户本次明确要求
3. 当前公众号 `.txt` 原文
4. 当前代码文件实际情况
5. 本 `SUMMARY_RULES.md`
6. 历史对话经验

如果本规范和当前项目规则冲突，以当前项目规则为准。  
如果本规范和用户本次明确要求冲突，以用户本次明确要求为准。  
如果无法判断，必须在最终输出中说明冲突点和采用的处理方式。
