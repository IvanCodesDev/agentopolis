"use client";

import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  containsSensitiveContent,
  createQuestSchema,
  type CreateQuestFormValues,
  type CreateQuestInput,
} from "@/lib/demo/validation";

interface CreateQuestFormProps {
  onCancel: () => void;
  onCreated: (input: CreateQuestInput) => void;
}

export function CreateQuestForm({
  onCancel,
  onCreated,
}: CreateQuestFormProps) {
  const [pendingSensitive, setPendingSensitive] =
    useState<CreateQuestInput | null>(null);
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<CreateQuestFormValues>({
    defaultValues: {
      category: "",
      role: "",
      startDate: "",
      dueDate: "",
      confidentiality: "1",
      summary: "",
      recipient: "",
    },
  });
  const confidentiality = watch("confidentiality");

  useEffect(() => {
    if (confidentiality === "2") {
      setValue("summary", "");
      clearErrors("summary");
    }
  }, [clearErrors, confidentiality, setValue]);

  const validateAndSubmit = (values: CreateQuestFormValues) => {
    clearErrors();
    const result = createQuestSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateQuestFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    if (containsSensitiveContent(result.data.summary)) {
      setPendingSensitive(result.data);
      return;
    }
    onCreated(result.data);
  };

  if (pendingSensitive) {
    return (
      <section className="sensitiveConfirm" aria-label="敏感信息确认">
        <ShieldAlert aria-hidden="true" size={30} />
        <h2>摘要可能包含敏感信息</h2>
        <p>
          检测仅用于提醒，可能存在误判。请确认公开摘要中不含客户名、价格、联系方式或未发布信息。
        </p>
        <div className="formActions">
          <button
            className="secondaryButton"
            onClick={() => setPendingSensitive(null)}
            type="button"
          >
            返回修改
          </button>
          <button
            className="primaryButton"
            onClick={() => onCreated(pendingSensitive)}
            type="button"
          >
            仍然创建任务
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="createQuestForm"
      noValidate
      onSubmit={handleSubmit(validateAndSubmit)}
    >
      <button className="backButton" onClick={onCancel} type="button">
        <ArrowLeft aria-hidden="true" size={15} />
        返回公告板
      </button>
      <div className="formNotice">
        <AlertTriangle aria-hidden="true" size={16} />
        <p>不得填写客户名、价格、联系方式和未发布信息。</p>
      </div>

      <div className="fieldGrid">
        <label>
          <span>项目类别</span>
          <select {...register("category")}>
            <option value="">请选择</option>
            <option value="电商视觉">电商视觉</option>
            <option value="UI 界面">UI 界面</option>
            <option value="品牌系统">品牌系统</option>
            <option value="插画设计">插画设计</option>
          </select>
          {errors.category ? (
            <small className="fieldError">{errors.category.message}</small>
          ) : null}
        </label>
        <label>
          <span>设计角色</span>
          <select {...register("role")}>
            <option value="">请选择</option>
            <option value="主视觉设计师">主视觉设计师</option>
            <option value="执行设计师">执行设计师</option>
            <option value="UI 设计师">UI 设计师</option>
            <option value="视觉规范设计师">视觉规范设计师</option>
          </select>
          {errors.role ? (
            <small className="fieldError">{errors.role.message}</small>
          ) : null}
        </label>
        <label>
          <span>开始日期</span>
          <input type="date" {...register("startDate")} />
          {errors.startDate ? (
            <small className="fieldError">{errors.startDate.message}</small>
          ) : null}
        </label>
        <label>
          <span>预计完成日期</span>
          <input type="date" {...register("dueDate")} />
          {errors.dueDate ? (
            <small className="fieldError">{errors.dueDate.message}</small>
          ) : null}
        </label>
      </div>

      <label>
        <span>保密等级</span>
        <select {...register("confidentiality")}>
          <option value="1">等级 1 · 可使用去标识化摘要</option>
          <option value="2">等级 2 · 不公开摘要</option>
        </select>
      </label>

      <label>
        <span>公开贡献摘要</span>
        <textarea
          disabled={confidentiality === "2"}
          placeholder={
            confidentiality === "2"
              ? "保密等级 2 已禁用公开摘要"
              : "只描述职责、交付物和修改轮次"
          }
          rows={4}
          {...register("summary")}
        />
        {errors.summary ? (
          <small className="fieldError">{errors.summary.message}</small>
        ) : null}
      </label>

      <label>
        <span>设计师钱包（可选）</span>
        <input
          autoComplete="off"
          placeholder="0x…"
          {...register("recipient")}
        />
        {errors.recipient ? (
          <small className="fieldError">{errors.recipient.message}</small>
        ) : null}
      </label>

      <div className="formActions formActionsSticky">
        <button className="secondaryButton" onClick={onCancel} type="button">
          取消
        </button>
        <button className="primaryButton" type="submit">
          保存匿名任务
        </button>
      </div>
    </form>
  );
}

