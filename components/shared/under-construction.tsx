import Link from "next/link";
import { ArrowLeft, Construction, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NavigationItem } from "@/lib/navigation";

interface UnderConstructionProps {
  item: NavigationItem;
}

export function UnderConstruction({ item }: UnderConstructionProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-150px)] max-w-4xl items-center">
      <section className="w-full border-y border-border bg-white px-6 py-12 sm:px-10 lg:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Construction className="h-5 w-5" />
              </div>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                功能建设中
              </span>
            </div>
            <p className="text-[11px] font-semibold text-blue-600">SPRINT 1 ROUTE READY</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{item.label}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              当前已完成路由和全局导航接入。下一阶段将先补齐数据结构、加载状态、空状态和错误处理，再实现正式业务界面。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  返回工作台
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/content">
                  <Layers3 className="h-4 w-4" />
                  查看内容中心
                </Link>
              </Button>
            </div>
          </div>
          <div className="w-full max-w-xs border-l-2 border-blue-500 pl-5">
            <p className="text-xs font-medium text-slate-900">当前状态</p>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">路由</dt>
                <dd className="font-medium text-emerald-600">已建立</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">数据模型</dt>
                <dd className="font-medium text-slate-700">待设计</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">业务交互</dt>
                <dd className="font-medium text-slate-700">Sprint 2+</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
