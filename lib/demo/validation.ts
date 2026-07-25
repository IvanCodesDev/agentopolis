import { z } from "zod";

const ethereumAddress = /^0x[a-fA-F0-9]{40}$/;

export const createQuestSchema = z
  .object({
    category: z.string().trim().min(1, "请选择项目类别"),
    role: z.string().trim().min(1, "请选择设计角色"),
    startDate: z.string().min(1, "请选择开始日期"),
    dueDate: z.string().min(1, "请选择预计完成日期"),
    confidentiality: z.enum(["1", "2"]),
    summary: z.string(),
    recipient: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || ethereumAddress.test(value),
        "请输入有效的 0x 钱包地址",
      ),
  })
  .superRefine((value, context) => {
    if (
      value.startDate &&
      value.dueDate &&
      value.dueDate < value.startDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "预计完成日期不能早于开始日期",
      });
    }
    if (value.confidentiality === "1" && value.summary.trim().length < 8) {
      context.addIssue({
        code: "custom",
        path: ["summary"],
        message: "请填写至少 8 个字的去标识化摘要",
      });
    }
  })
  .transform((value) => ({
    ...value,
    confidentiality: Number(value.confidentiality) as 1 | 2,
    summary: value.confidentiality === "2" ? "" : value.summary.trim(),
  }));

export type CreateQuestFormValues = z.input<typeof createQuestSchema>;
export type CreateQuestInput = z.output<typeof createQuestSchema>;

const sensitivePatterns = [
  /客户名/i,
  /价格/i,
  /微信/i,
  /未发布/i,
  /@/,
  /\b1[3-9]\d{9}\b/,
];

export function containsSensitiveContent(value: string) {
  return sensitivePatterns.some((pattern) => pattern.test(value));
}

