/**
 * 01：从托管 OSS 过渡到自建 MinIO，用 putObject(bucket, key, stream) 上传。
 * 外部前置条件 / TODO：可用的 MinIO 服务、已存在的 aaa 桶与根 .env 凭据。
 * 本例沿用 localhost:9000、HTTP；Docker 部署未验证，执行会写入固定对象。
 */
// 统一加载仓库根 .env，不受运行命令所在目录影响。
import "@lessons/shared/env-loader";
import fs from "fs";
import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: "localhost",
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

async function putStream() {
  try {
    const stream = fs.createReadStream(new URL("../zao.png", import.meta.url));
    const result = await minioClient.putObject(
      "aaa",
      "ccc/ddd/hello.png",
      stream,
    );
    console.log(result);
    console.log("上传成功");
  } catch (err) {
    console.log(err);
    process.exitCode = 1;
  }
}

putStream();
