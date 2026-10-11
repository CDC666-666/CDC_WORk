import type { PublicProject } from "@/types/public-portfolio";

export function ProjectVisual({ kind }: { kind: PublicProject["visual"] }) {
  if (kind === "robot") return <div className="project-visual project-visual-robot" role="img" aria-label="自绘全向轮步兵结构示意图，非实车照片">
    <span className="visual-label">CONTROL / 01</span>
    <svg viewBox="0 0 440 270" aria-hidden="true" fill="none">
      <path d="M27 201H413M58 51H383M58 51V201M383 51V201" stroke="currentColor" opacity=".2"/>
      <circle cx="220" cy="136" r="91" stroke="currentColor" opacity=".22" strokeDasharray="3 7"/>
      <path d="M138 162L166 95H274L302 162L264 189H176L138 162Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M164 123H277M220 94V68M197 68H243M177 189V211M264 189V211" stroke="currentColor" strokeWidth="2"/>
      <circle cx="220" cy="121" r="15" stroke="currentColor" strokeWidth="2"/>
      <circle cx="150" cy="191" r="19" stroke="currentColor" strokeWidth="2"/><circle cx="290" cy="191" r="19" stroke="currentColor" strokeWidth="2"/>
      <path d="M290 89H349M290 89L298 79M290 89L298 99M121 84H71M121 84L113 74M121 84L113 94" stroke="currentColor" opacity=".58"/>
      <circle cx="220" cy="121" r="4" fill="currentColor"/><circle cx="349" cy="89" r="3" fill="currentColor"/>
      <text x="64" y="72" fill="currentColor" fontSize="9">VISION</text><text x="334" y="79" fill="currentColor" fontSize="9">MOTION</text>
    </svg>
    <span className="visual-bottom">自绘示意 · EMBEDDED / CONTROL</span>
  </div>;
  if (kind === "arm") return <div className="project-visual project-visual-arm" role="img" aria-label="自绘三轴机械臂示意图，非实物照片">
    <span className="visual-label">MOTION / 02</span>
    <svg viewBox="0 0 440 270" aria-hidden="true" fill="none">
      <path d="M29 208H411M55 54H382M55 54V208M382 54V208" stroke="currentColor" opacity=".17"/>
      <path d="M102 206H339M167 205V181H241V205M204 183L233 124L279 136L320 89" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M320 89L347 74M320 89L346 101" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="204" cy="183" r="13" fill="#eff5ff" stroke="currentColor" strokeWidth="3"/>
      <circle cx="233" cy="124" r="12" fill="#eff5ff" stroke="currentColor" strokeWidth="3"/>
      <circle cx="279" cy="136" r="12" fill="#eff5ff" stroke="currentColor" strokeWidth="3"/>
      <path d="M137 132C168 75 245 56 304 81" stroke="currentColor" opacity=".35" strokeDasharray="5 7"/>
      <text x="105" y="145" fill="currentColor" fontSize="9">AXIS 01</text><text x="249" y="74" fill="currentColor" fontSize="9">AXIS 03</text>
    </svg>
    <span className="visual-bottom">自绘示意 · THREE AXES / MOTOR</span>
  </div>;
  return <div className="project-visual project-visual-workspace" role="img" aria-label="自绘工作台模块示意图，非实际界面截图">
    <span className="visual-label">SYSTEM / 03</span>
    <svg viewBox="0 0 440 270" aria-hidden="true" fill="none">
      <rect x="58" y="52" width="324" height="166" rx="7" stroke="currentColor" strokeWidth="2"/>
      <path d="M58 84H382M154 84V218" stroke="currentColor" opacity=".55"/>
      <circle cx="76" cy="69" r="3" fill="currentColor"/><circle cx="88" cy="69" r="3" fill="currentColor" opacity=".5"/>
      <path d="M77 105H132M77 126H117M77 147H137M77 168H123" stroke="currentColor" strokeWidth="5" opacity=".42"/>
      <rect x="174" y="105" width="87" height="45" rx="3" stroke="currentColor"/>
      <rect x="278" y="105" width="82" height="45" rx="3" stroke="currentColor"/>
      <rect x="174" y="164" width="186" height="31" rx="3" stroke="currentColor"/>
      <path d="M190 123H245M190 135H222M295 123H345M295 135H324M190 179H341" stroke="currentColor" opacity=".5"/>
    </svg>
    <span className="visual-bottom">自绘示意 · KNOWLEDGE / DATA</span>
  </div>;
}
