'use client'

import { useRouter } from 'next/navigation'

type Props = {
  projectId: number
  projectName?: string
  compact?: boolean
}

export default function ProjectStrategyEntry({ projectId, projectName, compact = false }: Props) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/strategy/${projectId}`)}
      title={projectName ? `開啟 ${projectName} 的 AI 新品策略` : '開啟 AI 新品策略'}
      style={{
        border: '1px solid #c7d2fe',
        background: '#eef2ff',
        color: '#324BAA',
        borderRadius: 10,
        padding: compact ? '7px 10px' : '10px 14px',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      AI 新品策略
    </button>
  )
}
