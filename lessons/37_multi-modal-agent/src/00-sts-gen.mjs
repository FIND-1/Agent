/**
 * 复习：OSS Post Policy 签名；承接第 36 课服务端上传。这里不是 STS AssumeRole。
 * 在课程目录运行：node src/00-sts-gen.mjs
 * 依赖与失败排查见 ../README.md；本轮仅做静态验证，不执行远程请求。
 */
import "@lessons/shared/env-loader";
import OSS from "ali-oss";

async function main() {
  const config = {
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  };

  const client = new OSS(config);

  const date = new Date();

  date.setDate(date.getDate() + 1);

  const res = client.calculatePostSignature({
    expiration: date.toISOString(),
    conditions: [
      ["content-length-range", 0, 1048576000], //设置上传文件的大小限制。
    ],
  });

  console.log(res);

  const location = await client.getBucketLocation();

  const host = `http://${config.bucket}.${location.location}.aliyuncs.com`;

  console.log(host);
}

main();
