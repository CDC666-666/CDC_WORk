export type FinanceTransactionType = "收入" | "支出" | "转账";
export type FinanceCategory = string;

export interface FinanceCategorySetting { name: string; color: string }

export interface FinanceTransaction {
  id: string;
  type: FinanceTransactionType;
  category: FinanceCategory;
  amount: number;
  date: string;
  account: string;
  description: string;
  note?: string;
  tags: string[];
  /** Only used to allocate multi-tag expenses to one statistical slice. */
  primaryTag?: string;
  createdAt: string;
  updatedAt: string;
}

export type FinanceTransactionDraft = Omit<FinanceTransaction, "id" | "createdAt" | "updatedAt">;

