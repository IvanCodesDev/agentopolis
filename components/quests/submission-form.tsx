"use client";

import { FileText, Send } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import type { QuestSubmission } from "@/lib/demo/types";

interface SubmissionFormProps {
  initialValue?: QuestSubmission;
  onSubmit: (submission: QuestSubmission) => void;
}

export function SubmissionForm({
  initialValue,
  onSubmit,
}: SubmissionFormProps) {
  const [publicSummary, setPublicSummary] = useState(
    initialValue?.publicSummary ?? "",
  );
  const [fileName, setFileName] = useState(initialValue?.fileName ?? "");
  const [errors, setErrors] = useState<{
    publicSummary?: string;
    fileName?: string;
  }>({});
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const fileNameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      publicSummary: publicSummary.trim()
        ? undefined
        : "请填写公开成果摘要",
      fileName: fileName.trim() ? undefined : "请填写模拟文件名",
    };
    setErrors(nextErrors);

    if (nextErrors.publicSummary) {
      summaryRef.current?.focus();
      return;
    }
    if (nextErrors.fileName) {
      fileNameRef.current?.focus();
      return;
    }

    onSubmit({
      publicSummary: publicSummary.trim(),
      fileName: fileName.trim(),
    });
  };

  return (
    <form className="submissionForm" onSubmit={handleSubmit}>
      <div className="formNotice">
        <FileText aria-hidden="true" size={17} />
        <p>这里只保存公开演示摘要和文件名，不会上传真实文件。</p>
      </div>
      <label>
        公开成果摘要
        <textarea
          aria-label="公开成果摘要"
          aria-describedby={
            errors.publicSummary ? "submission-summary-error" : undefined
          }
          aria-invalid={Boolean(errors.publicSummary)}
          onChange={(event) => setPublicSummary(event.target.value)}
          ref={summaryRef}
          rows={4}
          value={publicSummary}
        />
        {errors.publicSummary ? (
          <span
            className="fieldError"
            id="submission-summary-error"
            role="alert"
          >
            {errors.publicSummary}
          </span>
        ) : null}
      </label>
      <label>
        模拟文件名
        <input
          aria-label="模拟文件名"
          aria-describedby={
            errors.fileName ? "submission-file-error" : undefined
          }
          aria-invalid={Boolean(errors.fileName)}
          onChange={(event) => setFileName(event.target.value)}
          placeholder="例如：final-layout.fig"
          ref={fileNameRef}
          value={fileName}
        />
        {errors.fileName ? (
          <span
            className="fieldError"
            id="submission-file-error"
            role="alert"
          >
            {errors.fileName}
          </span>
        ) : null}
      </label>
      <button className="primaryButton questFlowPrimary" type="submit">
        <Send aria-hidden="true" size={15} />
        提交成果
      </button>
    </form>
  );
}
