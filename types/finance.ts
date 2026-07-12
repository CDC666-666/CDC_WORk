export type FinanceTransactionType = "收入" | "支出";
export type FinanceCategory = "生活" | "学习" | "交通" | "设备" | "RoboMaster" | "项目" | "娱乐" | "奖学金" | "兼职" | "其他";

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  category: FinanceCategory;
  amount: number;
  date: string;
  account: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type FinanceTransactionDraft = Omit<FinanceTransaction, "id" | "createdAt" | "updatedAt">;

