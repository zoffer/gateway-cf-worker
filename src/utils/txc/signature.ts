import crypto from "crypto";
import type { BinaryToTextEncoding } from "crypto";
import { env } from "cloudflare:workers";

function sha256(
  message: string,
  secret: string | Buffer<ArrayBuffer>,
  encoding?: BinaryToTextEncoding,
) {
  const hmac = crypto.createHmac("sha256", secret);
  const r = hmac.update(message);
  if (encoding) {
    return r.digest(encoding);
  }
  return r.digest();
}

function getHash(message: string, encoding: BinaryToTextEncoding = "hex") {
  const hash = crypto.createHash("sha256");
  return hash.update(message).digest(encoding);
}

function getDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
  const day = ("0" + date.getUTCDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

export function signature(o: {
  endpoint: string;
  service: string;
  region: string;
  action: string;
  version: string;
  payload: string;
}) {
  // 密钥参数
  const SECRET_ID = env.TENCENT_CLOUD_SECRET_ID;
  const SECRET_KEY = env.TENCENT_CLOUD_SECRET_KEY;

  const { payload, endpoint, service, region, action, version } = o;
  //const timestamp = getTime()
  const timestamp = Math.floor(Date.now() / 1000);
  //时间处理, 获取世界时间日期
  const date = getDate(timestamp);

  // ************* 步骤 1：拼接规范请求串 *************

  const hashedRequestPayload = getHash(payload);
  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  const canonicalHeaders =
    "content-type:application/json; charset=utf-8\n" +
    "host:" +
    endpoint +
    "\n" +
    "x-tc-action:" +
    action.toLowerCase() +
    "\n";
  const signedHeaders = "content-type;host;x-tc-action";

  const canonicalRequest =
    httpRequestMethod +
    "\n" +
    canonicalUri +
    "\n" +
    canonicalQueryString +
    "\n" +
    canonicalHeaders +
    "\n" +
    signedHeaders +
    "\n" +
    hashedRequestPayload;

  // ************* 步骤 2：拼接待签名字符串 *************
  const algorithm = "TC3-HMAC-SHA256";
  const hashedCanonicalRequest = getHash(canonicalRequest);
  const credentialScope = date + "/" + service + "/" + "tc3_request";
  const stringToSign =
    algorithm +
    "\n" +
    timestamp +
    "\n" +
    credentialScope +
    "\n" +
    hashedCanonicalRequest;

  // ************* 步骤 3：计算签名 *************
  const kDate = sha256(date, "TC3" + SECRET_KEY);
  const kService = sha256(service, kDate);
  const kSigning = sha256("tc3_request", kService);
  const signature = sha256(stringToSign, kSigning, "hex");

  // ************* 步骤 4：拼接 Authorization *************
  const authorization =
    algorithm +
    " " +
    "Credential=" +
    SECRET_ID +
    "/" +
    credentialScope +
    ", " +
    "SignedHeaders=" +
    signedHeaders +
    ", " +
    "Signature=" +
    signature;

  return {
    url: "https://" + endpoint,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      Host: endpoint,
      "X-TC-Action": action,
      "X-TC-Timestamp": timestamp.toString(),
      "X-TC-Version": version,
      "X-TC-Region": region,
    },
    body: payload,
  };
}
