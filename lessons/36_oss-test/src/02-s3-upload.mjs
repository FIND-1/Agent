/**
 * 02：在两个专用 SDK 之后，用 S3Client + PutObjectCommand 理解 S3 兼容接口。
 * 外部前置条件 / TODO：RustFS 或其他兼容服务、hello 桶、根 .env 的 S3_* 配置。
 * 只展示单对象上传；协议兼容不保证所有厂商功能和签名/寻址配置完全相同。
 */
// 统一加载仓库根 .env，不受运行命令所在目录影响。
import "@lessons/shared/env-loader";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// 初始化统一S3客户端（RustFS/MinIO/阿里云OSS通用）
// 注意：原文“通用”需以服务端 S3 兼容能力为准，不能直接套用所有 OSS 原生端点。
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  // 原文 signatureVersion: 'v4' 是 v2 风格配置；v3 不靠这个字段选择签名版本。
  // 原文 region: 'aaa' // 本地私有存储随便填，不影响
  // 更正：region 会参与签名，须与服务端要求一致；us-east-1 仅为本地示例默认值。
  region: process.env.S3_REGION || "us-east-1",
});

/**
 * 文件流上传
 * @param {string} objectKey 对象路径 aaa/bbb/first.png
 * @param {ReadableStream} stream fs可读流
 * 更正：这里是 Node.js fs.ReadStream，不是 Web API 的 ReadableStream。
 * @param {string} contentType 文件类型（图片/pdf等）
 */
async function putStream(objectKey, stream, contentType = "image/png") {
  try {
    const uploadCmd = new PutObjectCommand({
      Bucket: "hello",
      Key: objectKey,
      Body: stream,
      ContentType: contentType,
    });
    await s3Client.send(uploadCmd);
    console.log("上传成功");
  } catch (err) {
    console.error("上传失败", err);
    throw err;
  }
}

async function main() {
  const stream = fs.createReadStream(new URL("../zao.png", import.meta.url));
  await putStream("aaa/bbb/first.png", stream, "image/png");
}

main();
