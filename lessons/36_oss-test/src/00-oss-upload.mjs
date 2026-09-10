/**
 * 00：用阿里云专用 SDK 理解 Bucket、Object Key 与文件流上传。
 * 需要根 .env 的 OSS_* 配置、可访问的云端 Bucket 及写入权限；不依赖模型 API。
 * 运行会写入固定 Key，重复执行可能覆盖同名对象；本轮仅做静态验证。
 */
// 统一加载仓库根 .env，不受运行命令所在目录影响。
import "@lessons/shared/env-loader";
import OSS from "ali-oss";
import fs from "fs";

const client = new OSS({
  // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  authorizationV4: true,
  bucket: process.env.OSS_BUCKET,
});

async function putStream() {
  try {
    // 使用chunked encoding。使用putStream接口时，SDK默认会发起一个chunked encoding的HTTP PUT请求。
    // 相对当前源码定位配套图片，从仓库根或课程目录执行都可找到。
    const stream = fs.createReadStream(new URL("../zao.png", import.meta.url));
    // 填写Object完整路径，例如exampledir/exampleobject.txt。Object完整路径中不能包含Bucket名称。
    const result = await client.putStream("test-agent/first.png", stream);
    console.log(result);
  } catch (e) {
    console.log(e);
    process.exitCode = 1;
  }
}

putStream();
