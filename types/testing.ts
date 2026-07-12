export type ParameterValue = string | number | boolean;
export type TestResultStatus = "通过" | "部分通过" | "失败" | "待复测";
export type IssueSeverity = "S1" | "S2" | "S3";
export type IssueStatus = "待定位" | "调查中" | "修复中" | "待验证" | "已解决" | "不处理";

export interface TestRecord {
  id: string;
  projectId: string;
  moduleId?: string;
  taskId?: string;
  workLogId?: string;
  title: string;
  testDate: string;
  environment: string;
  objective: string;
  procedure: string;
  inputParameters: Record<string, ParameterValue>;
  measurements: Record<string, ParameterValue>;
  expectedResult: string;
  actualResult: string;
  conclusion: string;
  resultStatus: TestResultStatus;
  attachmentNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalIssue {
  id: string;
  projectId: string;
  moduleId?: string;
  taskId?: string;
  testRecordId?: string;
  title: string;
  phenomenon: string;
  errorMessage: string;
  severity: IssueSeverity;
  status: IssueStatus;
  reproductionSteps: string;
  probableCause: string;
  rootCause: string;
  discoveredAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueSolution {
  id: string;
  issueId: string;
  title: string;
  content: string;
  result: string;
  isEffective: boolean;
  parametersBefore: Record<string, ParameterValue>;
  parametersAfter: Record<string, ParameterValue>;
  createdAt: string;
}

export type TestRecordDraft = Omit<TestRecord, "id" | "createdAt" | "updatedAt">;
export type TechnicalIssueDraft = Omit<TechnicalIssue, "id" | "createdAt" | "updatedAt">;
export type IssueSolutionDraft = Omit<IssueSolution, "id" | "createdAt">;

