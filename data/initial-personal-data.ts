import { localDateKeyWithOffset, localDateTimeWithOffset } from "@/lib/date";
import type { CalendarEvent } from "@/types/calendar";
import type { FinanceTransaction } from "@/types/finance";

export function createInitialPersonalData(now = new Date()): {
  calendarEvents: CalendarEvent[];
  financeTransactions: FinanceTransaction[];
} {
  const timestamp = now.toISOString();
  const calendarEvents: CalendarEvent[] = [
    { id: "event-circuit-class", title: "电路分析复习", eventType: "课程", startAt: localDateTimeWithOffset(now, 1, "19:00"), endAt: localDateTimeWithOffset(now, 1, "20:30"), allDay: false, sourceType: "manual", colorKey: "blue", notes: "演示日程：复习戴维南定理。", createdAt: timestamp, updatedAt: timestamp },
    { id: "event-week-review", title: "本周个人复盘", eventType: "个人", startAt: localDateTimeWithOffset(now, 5, "20:00"), endAt: localDateTimeWithOffset(now, 5, "21:00"), allDay: false, sourceType: "manual", colorKey: "violet", notes: "整理学习、项目和收支记录。", createdAt: timestamp, updatedAt: timestamp },
  ];
  const financeTransactions: FinanceTransaction[] = [
    { id: "finance-scholarship", type: "收入", category: "奖学金", amount: 600, date: localDateKeyWithOffset(now, -10), account: "校园卡关联账户", description: "演示收入记录", tags: ["演示"], createdAt: localDateTimeWithOffset(now, -10, "10:00"), updatedAt: timestamp },
    { id: "finance-book", type: "支出", category: "学习", amount: 68, date: localDateKeyWithOffset(now, -4), account: "微信", description: "演示记录：购买课程参考书", tags: ["书籍", "演示"], createdAt: localDateTimeWithOffset(now, -4, "16:00"), updatedAt: timestamp },
    { id: "finance-components", type: "支出", category: "RoboMaster", amount: 126, date: localDateKeyWithOffset(now, -3), account: "支付宝", description: "演示记录：调试线材与连接器", tags: ["硬件", "演示"], createdAt: localDateTimeWithOffset(now, -3, "18:00"), updatedAt: timestamp },
    { id: "finance-meal", type: "支出", category: "生活", amount: 24.5, date: localDateKeyWithOffset(now, -1), account: "校园卡", description: "演示生活支出", tags: ["演示"], createdAt: localDateTimeWithOffset(now, -1, "12:00"), updatedAt: timestamp },
    { id: "finance-transport", type: "支出", category: "交通", amount: 18, date: localDateKeyWithOffset(now, 0), account: "微信", description: "演示交通支出", tags: ["演示"], createdAt: localDateTimeWithOffset(now, 0, "08:00"), updatedAt: timestamp },
  ];
  return { calendarEvents, financeTransactions };
}

