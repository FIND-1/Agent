/**
 * 🧠 JSON Schema 概念补充
 *
 * withStructuredOutput 底层能力之一：
 * - tool calling
 * - output parser
 * - json schema
 *
 * 当前文件用于理解结构，而非生产代码
 */

import { z } from "zod";

const schema = z.object({
  name: z.string(),
  birth_year: z.number(),
  field: z.string(),
  achievements: z.array(z.string())
});

// zod → JSON Schema 转换思路
