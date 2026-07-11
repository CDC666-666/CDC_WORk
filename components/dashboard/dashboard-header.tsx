import { BatteryCharging, Cpu, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { activeProject, projectModules, userProfile } from "@/data/mock-data";

export function DashboardHeader() {
  return (
    <section className="mb-5 border-b border-border pb-6 lg:mb-6 lg:pb-7">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="success">系统就绪</Badge>
            <span className="font-mono text-[10px] text-muted-foreground">
              {activeProject.code} / {activeProject.season}
            </span>
          </div>
          <p className="mb-1 text-sm text-muted-foreground">
            欢迎回来，{userProfile.name}
          </p>
          <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl lg:text-[34px]">
            {activeProject.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-cyan-300" />
              {userProfile.primaryController}
            </span>
            <span className="flex items-center gap-2">
              <RadioTower className="h-3.5 w-3.5 text-emerald-300" />
              {userProfile.role}
            </span>
            <span className="flex items-center gap-2">
              <BatteryCharging className="h-3.5 w-3.5 text-amber-300" />
              {projectModules.length} 个重点模块
            </span>
          </div>
        </div>

        <div className="w-full border-l-2 border-cyan-300/60 pl-4 xl:w-[330px]">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] text-muted-foreground">CURRENT FOCUS</p>
            <span className="text-xs text-amber-300">高优先级</span>
          </div>
          <p className="text-sm font-medium text-foreground">M3508 双环参数复测</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            采集速度环阶跃响应，完成带载工况参数对比。
          </p>
        </div>
      </div>
    </section>
  );
}
