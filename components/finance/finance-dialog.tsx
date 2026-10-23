"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toBeijingDateKey } from "@/lib/date";
import type { FinanceCategorySetting, FinanceTransaction, FinanceTransactionDraft, FinanceTransactionType } from "@/types/finance";

export function FinanceDialog({ open, transaction, categories, onClose, onSubmit }: {
  open: boolean; transaction: FinanceTransaction | null; categories: FinanceCategorySetting[];
  onClose: () => void; onSubmit: (draft: FinanceTransactionDraft, current: FinanceTransaction | null) => Promise<unknown>;
}) {
  const [form, setForm] = useState({ type: "支出" as FinanceTransactionType, category: "其他", amount: "",
    date: toBeijingDateKey(), account: "", description: "", note: "", tags: "" });
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm(transaction ? { type: transaction.type, category: transaction.category, amount: transaction.amount.toFixed(2),
      date: transaction.date, account: transaction.account, description: transaction.description,
      note: transaction.note ?? "", tags: transaction.tags.join(", ") } : {
      type: "支出", category: "其他", amount: "", date: toBeijingDateKey(),
      account: "", description: "", note: "", tags: "",
    });
    setError("");
  }, [open, transaction]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d+(?:\.\d{1,2})?$/.test(form.amount) || Number(form.amount) <= 0 || !form.category ||
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { setError("请填写有效金额、分类与日期；金额最多两位小数。"); return; }
    try {
      await onSubmit({ ...form, amount: Number(form.amount), description: form.description.trim(),
        note: form.note.trim(), tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) }, transaction);
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "服务器保存失败。"); }
  };
  return <Dialog open={open} title={transaction ? "编辑账单" : "快速记账"} onClose={onClose}
    footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="finance-form">保存记录</Button></>}>
    <form id="finance-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="收支方向" htmlFor="finance-type"><Select id="finance-type" value={form.type}
        onChange={(event) => setForm({ ...form, type: event.target.value as FinanceTransactionType })}><option>支出</option><option>收入</option><option>转账</option></Select></FormField>
      <FormField label="分类" htmlFor="finance-category"><Select id="finance-category" value={form.category}
        onChange={(event) => setForm({ ...form, category: event.target.value })}>
        {!categories.some((item) => item.name === form.category) && <option>{form.category}</option>}
        {categories.map((item) => <option key={item.name}>{item.name}</option>)}
      </Select></FormField>
      <FormField label="金额（元）" htmlFor="finance-amount" error={error}><Input id="finance-amount" inputMode="decimal"
        placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></FormField>
      <FormField label="账单日期" htmlFor="finance-date"><Input id="finance-date" type="date" value={form.date}
        onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormField>
      <FormField label="用途或标题" htmlFor="finance-description"><Input id="finance-description" value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
      <FormField label="账户或支付方式" htmlFor="finance-account"><Input id="finance-account" value={form.account}
        onChange={(event) => setForm({ ...form, account: event.target.value })} /></FormField>
      <FormField label="标签（逗号分隔）" htmlFor="finance-tags"><Input id="finance-tags" value={form.tags}
        onChange={(event) => setForm({ ...form, tags: event.target.value })} /></FormField>
      <div className="sm:col-span-2"><FormField label="备注" htmlFor="finance-note"><Textarea id="finance-note"
        value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></FormField></div>
    </form>
  </Dialog>;
}
