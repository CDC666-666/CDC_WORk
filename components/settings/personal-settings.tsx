"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SquareImageCropper } from "@/components/settings/square-image-cropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBranding } from "@/components/providers/branding-provider";
import type { WorkspaceBranding } from "@/types/workspace-branding";

export function PersonalSettings() {
  const { branding, loading, error, reload, save } = useBranding();
  const [profile, setProfile] = useState({ displayName: branding.displayName, bio: branding.bio, avatar: branding.avatar });
  const [workspace, setWorkspace] = useState({ workspaceName: branding.workspaceName,
    workspaceSubtitle: branding.workspaceSubtitle, workspaceIcon: branding.workspaceIcon });
  const [saving, setSaving] = useState<"profile" | "workspace" | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setProfile({ displayName: branding.displayName, bio: branding.bio, avatar: branding.avatar });
  }, [branding.displayName, branding.bio, branding.avatar]);
  useEffect(() => {
    setWorkspace({ workspaceName: branding.workspaceName, workspaceSubtitle: branding.workspaceSubtitle,
      workspaceIcon: branding.workspaceIcon });
  }, [branding.workspaceName, branding.workspaceSubtitle, branding.workspaceIcon]);
  const submit = async (part: "profile" | "workspace", values: Partial<WorkspaceBranding>) => {
    setSaving(part); setNotice("");
    try { await save(values); setNotice(part === "profile" ? "个人资料已保存到服务器。" : "工作台标识已保存到服务器。"); }
    catch (cause: unknown) { setNotice(cause instanceof Error ? cause.message : "保存失败，请重试。"); }
    finally { setSaving(null); }
  };
  return <div className="space-y-5">
    <PageHeader eyebrow="SETTINGS" title="个人设置" description="资料与工作台标识分别保存到私人服务器。" />
    {loading && <p role="status" className="text-sm text-slate-500">正在读取设置…</p>}
    {error && <div role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}<Button className="ml-3" size="sm" onClick={() => { void reload(); }}>重试</Button></div>}
    {notice && <p role="status" className="rounded border bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
    <div className="grid gap-5 xl:grid-cols-2">
      <form className="space-y-4 rounded-lg border bg-white p-5" onSubmit={(event) => { event.preventDefault(); void submit("profile", profile); }}>
        <h2 className="font-semibold">个人资料</h2>
        <SquareImageCropper label="个人头像" value={profile.avatar} onChange={(avatar) => setProfile((item) => ({ ...item, avatar }))} />
        <label className="block text-xs">显示姓名<Input maxLength={60} value={profile.displayName} required onChange={(event) => setProfile((item) => ({ ...item, displayName: event.target.value }))} /></label>
        <label className="block text-xs">个人简介<Textarea maxLength={160} value={profile.bio} onChange={(event) => setProfile((item) => ({ ...item, bio: event.target.value }))} /></label>
        <Button type="submit" disabled={loading || Boolean(error) || saving !== null}>保存个人资料</Button>
      </form>
      <form className="space-y-4 rounded-lg border bg-white p-5" onSubmit={(event) => { event.preventDefault(); void submit("workspace", workspace); }}>
        <h2 className="font-semibold">工作台标识</h2>
        <SquareImageCropper label="工作台图标" value={workspace.workspaceIcon} onChange={(workspaceIcon) => setWorkspace((item) => ({ ...item, workspaceIcon }))} />
        <label className="block text-xs">工作台名称<Input maxLength={60} value={workspace.workspaceName} required onChange={(event) => setWorkspace((item) => ({ ...item, workspaceName: event.target.value }))} /></label>
        <label className="block text-xs">副标题<Input maxLength={60} value={workspace.workspaceSubtitle} onChange={(event) => setWorkspace((item) => ({ ...item, workspaceSubtitle: event.target.value }))} /></label>
        <Button type="submit" disabled={loading || Boolean(error) || saving !== null}>保存工作台标识</Button>
      </form>
    </div>
  </div>;
}
