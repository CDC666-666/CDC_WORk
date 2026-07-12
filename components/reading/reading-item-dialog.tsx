"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toLocalDateKey } from "@/lib/date";
import type { ReadingCategory, ReadingItem, ReadingItemDraft, ReadingStatus } from "@/types/reading";

interface Props { open: boolean; item: ReadingItem | null; onClose: () => void; onCreate: (draft: ReadingItemDraft) => void; onUpdate: (item: ReadingItem) => void; }

function initial(item: ReadingItem | null) {
  return item ? { title: item.title, author: item.author, category: item.category, totalPages: String(item.totalPages), currentPage: String(item.currentPage), dailyPageTarget: String(item.dailyPageTarget), startDate: item.startDate, targetDate: item.targetDate, status: item.status, rating: String(item.rating), notes: item.notes, tags: item.tags.join(", ") }
    : { title: "", author: "", category: "专业技术" as ReadingCategory, totalPages: "300", currentPage: "0", dailyPageTarget: "10", startDate: toLocalDateKey(), targetDate: toLocalDateKey(), status: "待读" as ReadingStatus, rating: "0", notes: "", tags: "" };
}

export function ReadingItemDialog({ open, item, onClose, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState(() => initial(item));
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(initial(item)); setError(""); } }, [item, open]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const totalPages = Number(form.totalPages);
    const currentPage = Math.min(Math.max(0, Number(form.currentPage)), totalPages);
    if (!form.title.trim() || !form.author.trim() || totalPages <= 0) { setError("请填写书名和作者，总页数必须大于 0。"); return; }
    const draft: ReadingItemDraft = { title: form.title.trim(), author: form.author.trim(), category: form.category, totalPages, currentPage, dailyPageTarget: Math.max(1, Number(form.dailyPageTarget)), startDate: form.startDate, targetDate: form.targetDate, status: form.status, rating: Math.min(5, Math.max(0, Number(form.rating))), notes: form.notes.trim(), tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) };
    if (item) onUpdate({ ...item, ...draft, completedAt: draft.status === "已完成" ? item.completedAt ?? new Date().toISOString() : undefined }); else onCreate(draft);
    onClose();
  };
  return <Dialog open={open} title={item ? "编辑书籍" : "新增书籍"} description="阅读进度和笔记会保存到本地 Workspace。" onClose={onClose} size="lg" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="reading-item-form">{item ? "保存修改" : "加入书架"}</Button></>}>
    <form id="reading-item-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="书名" htmlFor="book-title" error={error}><Input id="book-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus /></FormField><FormField label="作者" htmlFor="book-author"><Input id="book-author" value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></FormField>
      <FormField label="类别" htmlFor="book-category"><Select id="book-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ReadingCategory })}>{(["专业技术", "课程教材", "产品管理", "创业商业", "文学通识", "其他"] as ReadingCategory[]).map((value) => <option key={value}>{value}</option>)}</Select></FormField><FormField label="状态" htmlFor="book-status"><Select id="book-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ReadingStatus })}>{(["待读", "阅读中", "已完成", "已暂停"] as ReadingStatus[]).map((value) => <option key={value}>{value}</option>)}</Select></FormField>
      <FormField label="总页数" htmlFor="book-total"><Input id="book-total" type="number" min="1" value={form.totalPages} onChange={(event) => setForm({ ...form, totalPages: event.target.value })} /></FormField><FormField label="当前页" htmlFor="book-current"><Input id="book-current" type="number" min="0" value={form.currentPage} onChange={(event) => setForm({ ...form, currentPage: event.target.value })} /></FormField>
      <FormField label="每日目标页数" htmlFor="book-daily"><Input id="book-daily" type="number" min="1" value={form.dailyPageTarget} onChange={(event) => setForm({ ...form, dailyPageTarget: event.target.value })} /></FormField><FormField label="评分（0-5）" htmlFor="book-rating"><Input id="book-rating" type="number" min="0" max="5" step="0.5" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></FormField>
      <FormField label="开始日期" htmlFor="book-start"><Input id="book-start" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></FormField><FormField label="目标日期" htmlFor="book-target"><Input id="book-target" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></FormField>
      <div className="sm:col-span-2"><FormField label="阅读笔记" htmlFor="book-notes"><Textarea id="book-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="记录核心观点、疑问或下一步实践。" /></FormField></div><div className="sm:col-span-2"><FormField label="标签" htmlFor="book-tags"><Input id="book-tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="使用逗号分隔" /></FormField></div>
    </form>
  </Dialog>;
}

