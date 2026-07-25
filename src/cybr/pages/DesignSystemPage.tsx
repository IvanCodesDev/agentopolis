import type { ReactNode } from "react";
import { Shell } from "../shell";
import { Donut, ICON_NAMES, Icon, PixelPlate, Sparkline, Tag } from "../ui";

const COLORS = [
  { hex: "#7B5CFF", name: "主色紫", token: "--cy-purple" },
  { hex: "#C3FF4A", name: "荧光绿", token: "--cy-lime" },
  { hex: "#0B0B0C", name: "深黑", token: "--cy-black" },
  { hex: "#FFFFFF", name: "白色", token: "--cy-white" },
];

const TYPE_SCALE = [
  { label: "标题超大", spec: "32 / 40 Bold", className: "cy-d1" },
  { label: "大标题", spec: "24 / 32 Bold", className: "cy-d2" },
  { label: "正文", spec: "14 / 22 Regular", className: "cy-body" },
];

function Block({ index, title, en, children }: { index: string; title: string; en: string; children: ReactNode }) {
  return (
    <section className="cy-ds-block">
      <header>
        <span className="cy-label">{index}</span>
        <h2>
          {title} <em>{en}</em>
        </h2>
      </header>
      {children}
    </section>
  );
}

/** Board 07 —「设计语言 / Design System」*/
export function DesignSystemPage() {
  return (
    <Shell>
      <main className="cy-page cy-page-wide">
        <div className="cy-spread" style={{ marginBottom: 22 }}>
          <div className="cy-stack">
            <span className="cy-label">/07</span>
            <h1 className="cy-d1">设计语言 · Design System</h1>
          </div>
        </div>

        <div className="cy-ds">
          <Block index="01" title="颜色" en="Color">
            <div className="cy-swatches">
              {COLORS.map((color) => (
                <div key={color.hex}>
                  <span className="cy-swatch" style={{ background: color.hex }} />
                  <code>{color.hex}</code>
                  <span className="cy-xs cy-muted">{color.name}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block index="02" title="字体" en="Typography">
            <p className="cy-sm cy-dim" style={{ marginBottom: 14 }}>
              思源黑体 / Source Han Sans
            </p>
            <div className="cy-type-scale">
              {TYPE_SCALE.map((row) => (
                <div key={row.label}>
                  <span className={row.className}>{row.label}</span>
                  <code className="cy-xs cy-muted">{row.spec}</code>
                </div>
              ))}
            </div>
          </Block>

          <Block index="03" title="图标" en="Icons">
            <div className="cy-icon-grid">
              {ICON_NAMES.slice(0, 16).map((name) => (
                <span key={name} title={name}>
                  <Icon name={name} size={17} />
                </span>
              ))}
            </div>
          </Block>

          <Block index="04" title="按钮" en="Buttons">
            <div className="cy-ds-stack">
              <button type="button" className="cy-btn cy-btn-primary">
                主要按钮
                <Icon name="arrow" size={14} />
              </button>
              <button type="button" className="cy-btn cy-btn-dark">
                次要按钮
                <Icon name="arrow" size={14} />
              </button>
              <button type="button" className="cy-btn-text cy-row" style={{ gap: 6 }}>
                文本按钮
                <Icon name="right" size={14} />
              </button>
            </div>
          </Block>

          <Block index="05" title="标签" en="Tags">
            <div className="cy-ds-tags">
              <Tag status="run" />
              <Tag status="wait" />
              <Tag status="check" />
              <Tag status="done" />
              <Tag status="revoked" />
              <Tag status="check">已验证</Tag>
              <Tag status="lime" plain>
                已认证机构
              </Tag>
            </div>
          </Block>

          <Block index="06" title="卡片" en="Cards">
            <article className="cy-card cy-ds-card">
              <span className="cy-pixel-frame">
                <PixelPlate seed="ds-card" cols={16} rows={16} className="cy-pixel" />
              </span>
              <div className="cy-stack">
                <strong className="cy-sm">项目卡片</strong>
                <span className="cy-xs cy-muted">标题 + 缩略图 + 状态</span>
              </div>
              <Tag status="run" />
            </article>
          </Block>

          <Block index="07" title="数据可视化" en="Data">
            <div className="cy-ds-data">
              <div className="cy-stat">
                <b>12.8K</b>
                <Sparkline points={[4, 7, 5, 9, 8, 13, 11, 16]} />
              </div>
              <Donut
                slices={[
                  { label: "完成", value: 72, color: "var(--cy-purple)" },
                  { label: "剩余", value: 28, color: "#eeeef1" },
                ]}
                size={86}
                thickness={10}
                caption="72%"
              />
            </div>
          </Block>
        </div>
      </main>
    </Shell>
  );
}
