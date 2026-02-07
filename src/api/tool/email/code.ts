import { type Handler } from "hono";
import { z } from "zod";
import { tencentCloudPost } from "@/utils/txc/index";

const emailCodeSchema = z.object({
  subject: z.string(),
  email: z.email(),
  operation: z.string(),
  code: z.string(),
  expiration: z.string(),
});

export const emailCode: Handler = async (ctx) => {
  const body = await ctx.req.json();
  const res = emailCodeSchema.safeParse(body);
  if (!res.success) {
    return ctx.json({ error: z.prettifyError(res.error) }, 400);
  }
  const data = res.data;
  await tencentCloudPost({
    host: "ses.tencentcloudapi.com",
    service: "ses",
    region: "ap-guangzhou",
    action: "SendEmail",
    version: "2020-10-02",
    data: {
      FromEmailAddress: "bot@mail.7-f.cn",
      Subject: data.subject,
      Destination: [data.email],
      Template: {
        TemplateID: 42435,
        TemplateData: JSON.stringify({
          operation: data.operation,
          code: data.code,
          expiration: data.expiration,
        }),
      },
    },
  });
  return ctx.json({ ok: true });
};
