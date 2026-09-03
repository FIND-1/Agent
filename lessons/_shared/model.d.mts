import type { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

/**
 * @lessons/shared/model 的类型声明。
 * 供 NodeNext 解析（exports 中通过 "types" 条件指向本文件），
 * 让各 lesson 中 import { createChatModel, createEmbeddings, getChunkText } 获得 TS 类型。
 */

export function createChatModel(
  options?: Record<string, unknown>,
  temperature?: number,
): ChatOpenAI;

export function createEmbeddings(
  options?: Record<string, unknown>,
): OpenAIEmbeddings;

export function getChunkText(chunk: unknown): string;