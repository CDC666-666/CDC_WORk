"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { combineDateAndTime, toLocalDateKey, toLocalTimeInput } from "@/lib/date";
import type { Task, TaskDomain, TaskDraft, TaskStatus } from "@/types/task";

interface TaskFormDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onCreate: (draft: TaskDraft) => Promise<unknown> | void;
  onUpdate: (task: Task) => Promise<unknown> | void;
}

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Task["priority"];
  domain: TaskDomain;
  scheduledDate: string;
  dueTime: string;
  estimateHours: string;
  tags: string;
}

const domains: TaskDomain[] = ["学校学习", "阅读成长", "项目研发", "内容学习", "个人管理"];

function createFormState(task: Task | null): TaskFormState {
  return task
    ? {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        domain: task.domain,
        scheduledDate: task.scheduledDate,
        dueTime: toLocalTimeInput(task.dueAt),
        estimateHours: String(task.estimateHours),
        tags: task.tags.join(", "),
      }
    : {
        title: "",
        description: "",
        status: "待开始",
        priority: "中",
        domain: "个人管理",
        scheduledDate: toLocalDateKey(),
        dueTime: "21:00",
        estimateHours: "1",
        tags: "",
      };
}

export function TaskFormDialog({ open, task, onClose, onCreate, onUpdate }: TaskFormDialogProps) {
  const [form, setForm] = useState<TaskFormState>(() => createFormState(task));
  const [errors, setErrors] = useState<{ title?: string; estimateHours?: string }>({});

  useEffect(() => {
    if (open) {
      setForm(createFormState(task));
      setErrors({});
    }
  }, [open, task]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const estimateHours = Number(form.estimateHours);
    const nextErrors = {
      title: form.title.trim() ? undefined : "请输入任务标题。",
      estimateHours: estimateHours > 0 ? undefined : "预计耗时必须大于 0。",
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.estimateHours) return;

    const common: TaskDraft = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      domain: form.domain,
      scheduledDate: form.scheduledDate,
      dueAt: combineDateAndTime(form.scheduledDate, form.dueTime),
      estimateHours,
      actualHours: task?.actualHours ?? 0,
      tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      projectId: task?.projectId,
      moduleId: task?.moduleId,
      sourceType: task?.sourceType ?? "manual",
      sourceId: task?.sourceId,
    };

    try {
      if (task) {
        const completedAt = common.status === "已完成"
          ? task.completedAt ?? new Date().toISOString()
          : undefined;
        await onUpdate({ ...task, ...common, completedAt });
      } else {
        await onCreate(common);
      }
      onClose();
    } catch (cause: unknown) {
      setErrors({ title: cause instanceof Error ? cause.message : "服务器保存失败，请重试。" });
    }
  };

  return (
    <Dialog
      open={open}
      title={task ? "编辑任务" : "新增任务"}
      description="任务会保存到统一 Workspace 数据并同步首页。"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          <Button type="submit" form="task-form">{task ? "保存修改" : "创建任务"}</Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField label="标题" htmlFor="task-title" error={errors.title}>
            <Input id="task-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="描述" htmlFor="task-description">
            <Textarea id="task-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
        </div>
        <FormField label="状态" htmlFor="task-status">
          <Select id="task-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>
            {(["待开始", "进行中", "已完成", "受阻"] as TaskStatus[]).map((value) => <option key={value}>{value}</option>)}
          </Select>
        </FormField>
        <FormField label="优先级" htmlFor="task-priority">
          <Select id="task-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Task["priority"] })}>
            {(["高", "中", "低"] as Task["priority"][]).map((value) => <option key={value}>{value}</option>)}
          </Select>
        </FormField>
        <FormField label="所属领域" htmlFor="task-domain">
          <Select id="task-domain" value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value as TaskDomain })}>
            {domains.map((value) => <option key={value}>{value}</option>)}
          </Select>
        </FormField>
        <FormField label="计划日期" htmlFor="task-date">
          <Input id="task-date" type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} />
        </FormField>
        <FormField label="截止时间" htmlFor="task-time">
          <Input id="task-time" type="time" value={form.dueTime} onChange={(event) => setForm({ ...form, dueTime: event.target.value })} />
        </FormField>
        <FormField label="预计耗时（小时）" htmlFor="task-hours" error={errors.estimateHours}>
          <Input id="task-hours" type="number" min="0.1" step="0.1" value={form.estimateHours} onChange={(event) => setForm({ ...form, estimateHours: event.target.value })} />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="标签" htmlFor="task-tags" hint="使用逗号分隔多个标签。">
            <Input id="task-tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="例如：高等数学, 作业" />
          </FormField>
        </div>
      </form>
    </Dialog>
  );
}

