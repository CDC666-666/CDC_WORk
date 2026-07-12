import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-150px)] items-center justify-center text-center">
      <div>
        <FileQuestion className="mx-auto h-9 w-9 text-slate-400" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">页面不存在</h1>
        <p className="mt-2 text-sm text-slate-500">请通过左侧导航进入已规划的工作台模块。</p>
        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </Link>
        </Button>
      </div>
    </div>
  );
}
