import "server-only";

interface ContributionDay {
  date: string;
  count: number;
  level: string;
}

export interface ContributionCalendar {
  total: number;
  weeks: readonly (readonly ContributionDay[])[];
  fetchedAt: string;
}

const query = `query PortfolioContributionCalendar {
  user(login: "CDC666-666") {
    contributionsCollection {
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

function parseCalendar(value: unknown): ContributionCalendar | null {
  if (!value || typeof value !== "object" || !("data" in value)) return null;
  const data = value.data;
  if (!data || typeof data !== "object" || !("user" in data)) return null;
  const user = data.user;
  if (!user || typeof user !== "object" || !("contributionsCollection" in user)) return null;
  const collection = user.contributionsCollection;
  if (!collection || typeof collection !== "object" || !("restrictedContributionsCount" in collection) ||
    collection.restrictedContributionsCount !== 0 || !("contributionCalendar" in collection)) return null;
  const calendar = collection.contributionCalendar;
  if (!calendar || typeof calendar !== "object" || !("totalContributions" in calendar) ||
    typeof calendar.totalContributions !== "number" || !("weeks" in calendar) || !Array.isArray(calendar.weeks)) return null;
  const weeks: ContributionDay[][] = [];
  for (const week of calendar.weeks) {
    if (!week || typeof week !== "object" || !("contributionDays" in week) || !Array.isArray(week.contributionDays)) return null;
    const days: ContributionDay[] = [];
    for (const day of week.contributionDays) {
      if (!day || typeof day !== "object" || !("date" in day) || !("contributionCount" in day) ||
        !("contributionLevel" in day) || typeof day.date !== "string" ||
        typeof day.contributionCount !== "number" || typeof day.contributionLevel !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(day.date) || day.contributionCount < 0 ||
        !["NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"].includes(day.contributionLevel)) return null;
      days.push({ date: day.date, count: day.contributionCount, level: day.contributionLevel });
    }
    weeks.push(days);
  }
  if (weeks.length < 50 || weeks.length > 54) return null;
  return { total: calendar.totalContributions, weeks, fetchedAt: new Date().toISOString() };
}

/** GitHub's official GraphQL calendar. No browser token and no private Workspace data. */
export async function getContributionCalendar(): Promise<ContributionCalendar | null> {
  const token = process.env.PORTFOLIO_GITHUB_PUBLIC_TOKEN;
  if (!token) return null;
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return parseCalendar(await response.json());
  } catch {
    return null;
  }
}
