"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { Uptime } from "@/components/portfolio/stats-summary";
import { publicPortfolio, publicProjects } from "@/data/public-portfolio";
import type { AnalyticsPeriod, PortfolioAnalytics, PortfolioAnalyticsResponse } from "@/types/portfolio-analytics";

function TrendChart({ data }: { data: PortfolioAnalytics }) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...data.trend.flatMap((item) => [item.views, item.visitors]));
  const point = (index: number, value: number) => ({ x: 28 + index * 742 / Math.max(1, data.trend.length - 1), y: 178 - value * 145 / max });
  const line = (key: "views" | "visitors") => data.trend.map((item, index) => { const p = point(index, item[key]); return `${index ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
  const area = data.trend.length ? `${line("views")} L770,178 L28,178 Z` : "";
  return <div className="portfolio-trend-chart"><div className="portfolio-chart-legend"><span>● 浏览量</span><span>● 访客数</span></div><svg viewBox="0 0 800 205" role="img" aria-label={`最近${data.period}天浏览量与访客数趋势`} preserveAspectRatio="none"><defs><linearGradient id="portfolio-traffic-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ddcf2" stopOpacity=".26" /><stop offset="100%" stopColor="#5ddcf2" stopOpacity="0" /></linearGradient></defs><path d="M28 178H770" className="portfolio-chart-grid" /><path d="M28 106H770" className="portfolio-chart-grid" /><path d="M28 33H770" className="portfolio-chart-grid" /><path d={area} fill="url(#portfolio-traffic-fill)" /><path d={line("views")} className="portfolio-chart-views" /><path d={line("visitors")} className="portfolio-chart-visitors" />{data.trend.map((item, index) => { const p = point(index, item.views); return <circle key={item.date} cx={p.x} cy={p.y} r={selected === index ? 6 : 3} className="portfolio-chart-point" tabIndex={0} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onMouseLeave={() => setSelected(null)} onBlur={() => setSelected(null)} onClick={() => setSelected(index)} aria-label={`${item.date}：浏览量 ${item.views}，访客数 ${item.visitors}`} />; })}</svg><div className="portfolio-chart-axis"><span>{data.trend[0]?.date}</span><span>{data.trend.at(-1)?.date}</span></div>{selected !== null && <div className="portfolio-chart-tooltip" role="status">{data.trend[selected].date} · 浏览量 {data.trend[selected].views} · 访客数 {data.trend[selected].visitors}</div>}</div>;
}

function Distribution({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const colors = ["#6bdced", "#508fc0", "#e4b871", "#ae9cdc", "#78bea6", "#ca8f9c"];
  let offset = 0;
  const gradient = items.map((item, index) => {
    const start = offset;
    offset += item.count / total * 100;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  }).join(", ");
  const heading = title === "DEVICE" ? "设备分布" : title === "BROWSER" ? "浏览器分布" : "流量来源";
  return <section className="portfolio-stat-panel portfolio-distribution-panel"><p className="portfolio-eyebrow">{title} / LAST 30 DAYS</p><h3>{heading}</h3>{total === 0 ? <p className="portfolio-muted">暂无访问数据</p> : <div className="portfolio-distribution-visual"><div className="portfolio-donut" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`${heading}，共${total}次浏览`}><div><strong>{total.toLocaleString()}</strong><small>次浏览</small></div></div><ul className="portfolio-distribution-legend">{items.map((item, index) => <li key={item.label}><span className="portfolio-legend-swatch" style={{ backgroundColor: colors[index % colors.length] }} /><span>{item.label}</span><strong>{Math.round(item.count / total * 100)}%</strong></li>)}</ul></div>}</section>;
}

function ActivityHeatmap({ data }: { data: PortfolioAnalytics }) {
  const max = Math.max(1, ...data.heatmap.map((item) => item.views));
  const weekday = ["一", "二", "三", "四", "五", "六", "日"];
  return <section className="portfolio-stat-panel portfolio-heat-panel"><p className="portfolio-eyebrow">ACTIVITY / ASIA-SHANGHAI</p><h3>访问活跃时段</h3><p className="portfolio-muted">最近 30 天，按星期与小时汇总浏览量。</p><div className="portfolio-heat-scroll"><div className="portfolio-heat-grid"><span className="portfolio-heat-corner" />{Array.from({ length: 24 }, (_, hour) => <span className="portfolio-heat-hour" key={hour}>{hour % 3 === 0 ? `${String(hour).padStart(2,"0")}时` : ""}</span>)}{weekday.map((day, dayIndex) => <div className="portfolio-heat-row" key={day}><span className="portfolio-heat-day">周{day}</span>{Array.from({ length: 24 }, (_, hour) => { const value = data.heatmap[dayIndex * 24 + hour]?.views ?? 0; return <span key={hour} className="portfolio-heat-cell" style={{ backgroundColor: value ? `rgba(72, 212, 239, ${.17 + .72 * value / max})` : "rgba(170,210,230,.08)" }} title={`周${day} ${String(hour).padStart(2,"0")}:00 · ${value} 次浏览`} aria-label={`周${day} ${hour}时：${value}次浏览`} />; })}</div>)}</div></div></section>;
}

export function StatsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<PortfolioAnalyticsResponse | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { fetch(`/api/public/portfolio-stats?days=${period}`, { cache: "no-store", signal: controller.signal }).then((response) => response.json()).then((result: PortfolioAnalyticsResponse) => setData(result)).catch(() => { if (!controller.signal.aborted) setData({ status: "error", message: "统计服务暂时不可用" }); }); };
    load();
    window.addEventListener("portfolio-visit-recorded", load);
    return () => { controller.abort(); window.removeEventListener("portfolio-visit-recorded", load); };
  }, [period, refresh]);
  return <>
    <div className="portfolio-stats-toolbar"><span>本站公开页面访问 · Asia/Shanghai</span><button type="button" onClick={() => { setData(null); setRefresh((value) => value + 1); }}><RefreshCw size={15} aria-hidden="true" /> 刷新数据</button></div>
    {!data ? <div className="portfolio-stats-notice" role="status">读取统计中…</div> : data.status !== "ok" ? <div className="portfolio-stats-notice" role="status"><h2>{data.message}</h2><p>{data.status === "not_configured" ? "本地统计数据库或服务端密钥尚未配置；公开项目页面仍可正常浏览。" : "稍后可再次刷新。公开项目页面仍可正常浏览。"}</p></div> : <>
      <div className="portfolio-stats-kpis"><article><span>累计访客</span><strong>{data.totals.visitors.toLocaleString()}</strong><small>匿名浏览器标识去重</small></article><article><span>累计浏览量</span><strong>{data.totals.views.toLocaleString()}</strong><small>已记录的公开页面导航</small></article><article><span>今日访客</span><strong>{data.totals.todayVisitors.toLocaleString()}</strong><small>上海时间自然日</small></article><article><span>今日浏览量</span><strong>{data.totals.todayViews.toLocaleString()}</strong><small>上海时间自然日</small></article></div>
      <div className="portfolio-stats-layout"><div className="portfolio-stats-main"><section className="portfolio-stat-panel portfolio-trend-panel"><div className="portfolio-stat-heading"><div><p className="portfolio-eyebrow">TRAFFIC / TREND</p><h2>访问趋势</h2><p className="portfolio-muted">每天的浏览量与独立访客数</p></div><div className="portfolio-periods" aria-label="趋势时间范围">{([7,30,90] as const).map((days) => <button type="button" key={days} aria-pressed={period === days} onClick={() => { setData(null); setPeriod(days); }}>{days} 天</button>)}</div></div><TrendChart data={data} /></section><ActivityHeatmap data={data} /></div><aside className="portfolio-stats-aside" aria-label="访问分布与热门页面"><div className="portfolio-stats-distributions"><Distribution title="DEVICE" items={data.devices} /><Distribution title="BROWSER" items={data.browsers} /><Distribution title="SOURCE" items={data.sources} /></div><section className="portfolio-stat-panel portfolio-popular-panel"><p className="portfolio-eyebrow">PUBLIC PAGES / LAST 30 DAYS</p><h2>热门页面</h2>{data.popular.length ? <ol className="portfolio-popular-list">{data.popular.map((item, index) => <li key={item.path}><span className="portfolio-popular-rank">{String(index + 1).padStart(2, "0")}</span><div><div><Link href={item.path}>{item.title} ↗</Link><strong>{item.views}</strong></div><span className="portfolio-popular-bar"><i style={{ width: `${item.views / Math.max(1, data.popular[0].views) * 100}%` }} /></span></div></li>)}</ol> : <p className="portfolio-muted">暂无访问数据</p>}</section></aside></div>
      <p className="portfolio-stats-updated">最后访问：{data.lastVisitAt ? new Date(data.lastVisitAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "暂无"} · 本次核对：{new Date(data.refreshedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}（上海时间）</p>
    </>}
    <div className="portfolio-site-facts"><div><span>实际公开项目</span><strong>{publicProjects.length}</strong></div><div><span>内容最近更新</span><strong>{publicPortfolio.updatedAt}</strong></div><div><span>网站运行时长</span><strong><Uptime /></strong></div></div>
    <p className="portfolio-privacy-note">访客以随机第一方 Cookie 去重：累计访客是全周期不同标识数量，不把每日访客数相加；清除 Cookie 或换浏览器会计为新访客。只记录本站公开页面，设备、浏览器与来源仅存类别。统计不包含私人工作台访问；本地预览数据与未来正式站点分开。</p>
  </>;
}
