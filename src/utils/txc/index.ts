import { signature } from "./signature";
export async function tencentCloudPost(o: {
  host: string;
  service: string;
  region: string;
  action: string;
  version: string;
  data: object;
}) {
  const { url, headers, body } = signature({
    endpoint: o.host,
    service: o.service,
    region: o.region,
    action: o.action,
    version: o.version,
    payload: JSON.stringify(o.data),
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return Promise.reject(
      new Error(`Request failed with status ${response.status}: ${errorText}`),
    );
  }
  const data = await response.json<{
    Response: {
      RequestId: string;
      Error?: {
        Code: string;
        Message: string;
      };
    };
  }>();

  if (response.status !== 200) {
    return Promise.reject(new Error(JSON.stringify(data)));
  }
  if (data?.Response?.Error) {
    console.error(data.Response.Error.Message);
    return Promise.reject(new Error(JSON.stringify(data)));
  }
  return data;
}
