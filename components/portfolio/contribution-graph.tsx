import { publicPortfolio } from "@/data/public-portfolio";
import type { ContributionCalendar } from "@/lib/portfolio/github-contributions";

export function ContributionGraph({ calendar }: { calendar: ContributionCalendar | null }) {
  return <section className="portfolio-contributions" aria-labelledby="contribution-title">
    <div className="portfolio-contribution-heading">
      <div><p className="portfolio-eyebrow">OPEN SOURCE / ACTIVITY</p><h2 id="contribution-title">GitHub 贡献</h2></div>
      <a className="portfolio-text-link" href={publicPortfolio.githubUrl} target="_blank" rel="noopener noreferrer">前往 GitHub <span className="sr-only">（新窗口打开）</span><span aria-hidden="true">↗</span></a>
    </div>
    {calendar ? <>
      <p className="portfolio-contribution-summary">GitHub 返回的过去一年贡献：<strong>{calendar.total}</strong> 次 <span>· 每小时最多更新一次 · 读取于 {calendar.fetchedAt.slice(0, 10)} UTC</span></p>
      <div className="portfolio-calendar-scroll" role="img" aria-label={`GitHub 过去一年逐日贡献图，共 ${calendar.total} 次贡献`}>
        <div className="portfolio-calendar">
          {calendar.weeks.map((week, index) => <div className="portfolio-calendar-week" key={`${week[0]?.date ?? "week"}-${index}`}>
            {week.map((day) => <span key={day.date} className={`portfolio-calendar-day level-${day.level.toLowerCase()}`} title={`${day.date}：${day.count} 次贡献`} />)}
          </div>)}
        </div>
      </div>
      <p className="portfolio-contribution-note">来源：GitHub 官方贡献日历。仅当返回的受限贡献计数为 0 时展示；贡献数不等同于项目质量。</p>
    </> : <p className="portfolio-contribution-fallback">当前无法可靠读取贡献日历。可以前往 GitHub 查看最新公开活动；这里不会补造图表数据。</p>}
  </section>;
}
