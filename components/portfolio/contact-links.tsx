"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Github, Mail, MessageCircle, X } from "lucide-react";
import Image from "next/image";

import { publicContact } from "@/data/public-contact";

type Props = { compact?: boolean };

export function ContactLinks({ compact = false }: Props) {
  const [feedback, setFeedback] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!qrOpen) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setQrOpen(false); triggerRef.current?.focus(); }
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [qrOpen]);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label}已复制`);
    } catch {
      setFeedback(`${label}复制失败，请手动选择文字`);
    }
  }

  return <>
    <div className={`portfolio-contact-links${compact ? " is-compact" : ""}`}>
      <a href={publicContact.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="打开 GitHub 主页"><Github size={18} aria-hidden="true" /><span>GitHub</span></a>
      {publicContact.email && <div className="portfolio-contact-group"><a href={`mailto:${publicContact.email}`}><Mail size={18} aria-hidden="true" /><span>{compact ? "邮箱" : publicContact.email}</span></a><button type="button" onClick={() => copy(publicContact.email!, "邮箱")} aria-label="复制邮箱"><Copy size={16} aria-hidden="true" /></button></div>}
      {publicContact.wechatId && <div className="portfolio-contact-group"><span className="portfolio-contact-value"><MessageCircle size={18} aria-hidden="true" /><span>{compact ? "微信" : publicContact.wechatId}</span></span><button type="button" onClick={() => copy(publicContact.wechatId!, "微信号")} aria-label="复制微信号"><Copy size={16} aria-hidden="true" /></button>{publicContact.wechatQrPath && <button ref={triggerRef} type="button" onClick={() => setQrOpen(true)}>查看二维码</button>}</div>}
    </div>
    <span className="portfolio-contact-feedback" role="status" aria-live="polite">{feedback && <>{feedback.includes("失败") ? <X size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{feedback}</>}</span>
    {qrOpen && publicContact.wechatQrPath && <div className="portfolio-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setQrOpen(false); triggerRef.current?.focus(); } }}><section role="dialog" aria-modal="true" aria-label="微信二维码" className="portfolio-qr-dialog"><button ref={closeRef} type="button" aria-label="关闭二维码" onClick={() => { setQrOpen(false); triggerRef.current?.focus(); }}><X size={19} /></button><h2>微信二维码</h2><Image src={publicContact.wechatQrPath} alt="Caider 的微信二维码" width={270} height={270} unoptimized /><p>微信号：{publicContact.wechatId}</p></section></div>}
  </>;
}
