"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Scale,
  Signpost,
  type LucideIcon,
} from "lucide-react"
import { useCallback, useId, useState } from "react"

import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  getInitiationLabel,
  getInitiationSubtitle,
  type InitiationNodeVariant,
  type InitiationTreeNode,
} from "@/lib/apprentissage/initiation"
import { cn } from "@/lib/utils"

const VARIANT_META: Record<
  InitiationNodeVariant,
  { icon: LucideIcon; accent: string; soft: string }
> = {
  root: { icon: BookOpen, accent: "#16a34a", soft: "#f0fdf4" },
  reglement: { icon: Scale, accent: "#2563eb", soft: "#eff6ff" },
  signalisation: { icon: Signpost, accent: "#d97706", soft: "#fffbeb" },
}

type InitiationSchemaProps = {
  root: InitiationTreeNode
  expandHint: string
  exploreCta: string
  comingSoonLabel: string
  sectionsCountLabel: (count: number) => string
}

type SectionProps = {
  node: InitiationTreeNode
  depth: number
  expandHint: string
  exploreCta: string
  comingSoonLabel: string
  sectionsCountLabel: (count: number) => string
  defaultOpen?: boolean
}

function InitiationSection({
  node,
  depth,
  expandHint,
  exploreCta,
  comingSoonLabel,
  sectionsCountLabel,
  defaultOpen = false,
}: SectionProps) {
  const { locale } = useVitrineLocale()
  const panelId = useId()
  const hasChildren = (node.children?.length ?? 0) > 0
  const [open, setOpen] = useState(defaultOpen)

  const primary = getInitiationLabel(node.title, locale)
  const secondary = getInitiationSubtitle(node.title, locale)
  const meta = VARIANT_META[node.variant]
  const Icon = meta.icon

  const toggle = useCallback(() => {
    if (hasChildren) setOpen((value) => !value)
  }, [hasChildren])

  if (node.href && !hasChildren) {
    return (
      <Link
        href={node.href}
        className={cn(
          "ap-init-link-card",
          depth > 0 && "ap-init-link-card--nested",
        )}
        style={
          {
            "--ap-init-accent": meta.accent,
            "--ap-init-soft": meta.soft,
          } as React.CSSProperties
        }
      >
        <span className="ap-init-link-card-icon" aria-hidden>
          <Icon className="size-4" />
        </span>
        <span className="ap-init-link-card-text">
          <span className="ap-init-link-card-title">{primary}</span>
          {secondary ? (
            <span className="ap-init-link-card-sub">{secondary}</span>
          ) : null}
        </span>
        <span className="ap-init-link-card-action">
          <span className="ap-init-link-card-cta">{exploreCta}</span>
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    )
  }

  if (!hasChildren) {
    return (
      <div
        className={cn("ap-init-leaf", depth > 0 && "ap-init-leaf--nested")}
        style={
          {
            "--ap-init-accent": meta.accent,
            "--ap-init-soft": meta.soft,
          } as React.CSSProperties
        }
      >
        <span className="ap-init-leaf-dot" aria-hidden />
        <span className="ap-init-leaf-text">
          <span className="ap-init-leaf-title">{primary}</span>
          {secondary ? (
            <span className="ap-init-leaf-sub">{secondary}</span>
          ) : null}
        </span>
        <span className="ap-init-leaf-badge">{comingSoonLabel}</span>
      </div>
    )
  }

  const isTopBranch = depth === 0

  return (
    <div
      className={cn(
        "ap-init-branch",
        isTopBranch && "ap-init-branch--top",
        open && "ap-init-branch--open",
      )}
      style={
        {
          "--ap-init-accent": meta.accent,
          "--ap-init-soft": meta.soft,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="ap-init-branch-trigger"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${primary} — ${expandHint}`}
      >
        <span className="ap-init-branch-icon" aria-hidden>
          <Icon className="size-5" />
        </span>
        <span className="ap-init-branch-text">
          <span className="ap-init-branch-title" dir="auto">
            {primary}
          </span>
          {secondary ? (
            <span className="ap-init-branch-sub" dir="auto">
              {secondary}
            </span>
          ) : null}
          {isTopBranch ? (
            <span className="ap-init-branch-count">
              {sectionsCountLabel(node.children!.length)}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn("ap-init-branch-chevron size-5", open && "is-open")}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className="ap-init-branch-panel"
        hidden={!open}
      >
        <div
          className={cn(
            "ap-init-branch-children",
            depth === 0 && "ap-init-branch-children--grid",
          )}
        >
          {node.children!.map((child) => (
            <InitiationSection
              key={child.slug}
              node={child}
              depth={depth + 1}
              expandHint={expandHint}
              exploreCta={exploreCta}
              comingSoonLabel={comingSoonLabel}
              sectionsCountLabel={sectionsCountLabel}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function InitiationSchema({
  root,
  expandHint,
  exploreCta,
  comingSoonLabel,
  sectionsCountLabel,
}: InitiationSchemaProps) {
  const { locale } = useVitrineLocale()
  const rootMeta = VARIANT_META.root
  const RootIcon = rootMeta.icon
  const primary = getInitiationLabel(root.title, locale)
  const secondary = getInitiationSubtitle(root.title, locale)

  return (
    <div className="ap-init-schema">
      <div
        className="ap-init-root-card"
        style={
          {
            "--ap-init-accent": rootMeta.accent,
            "--ap-init-soft": rootMeta.soft,
          } as React.CSSProperties
        }
      >
        <div className="ap-init-root-card-icon" aria-hidden>
          <RootIcon className="size-7" />
        </div>
        <div className="ap-init-root-card-body">
          <p className="ap-init-root-kicker">{primary}</p>
          {secondary ? (
            <p className="ap-init-root-sub" dir="auto">
              {secondary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="ap-init-schema-connector" aria-hidden>
        <span className="ap-init-schema-line" />
      </div>

      <div className="ap-init-schema-branches">
        {root.children?.map((branch) => (
          <InitiationSection
            key={branch.slug}
            node={branch}
            depth={0}
            expandHint={expandHint}
            exploreCta={exploreCta}
            comingSoonLabel={comingSoonLabel}
            sectionsCountLabel={sectionsCountLabel}
          />
        ))}
      </div>
    </div>
  )
}
