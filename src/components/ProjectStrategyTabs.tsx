'use client'

import ProjectStrategyEntry from './ProjectStrategyEntry'

type Props = {
  projectId: number
  projectName?: string
  active: 'strategy' | 'execution'
  onExecutionClick: () => void
}

export default function ProjectStrategyTabs({ projectId, projectName, active, onExecutionClick }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <ProjectStrategyEntry projectId={projectId} projectName={projectName} compact />
      <button
        type="button"
        onClick={onExecutionClick}
        aria-current={active === 'execution' ? 'page' : undefined}
        style={{
          border: active === 'execution' ? '1px solid #324BAA' : '1px solid #d1d5db',
          background: active === 'execution' ? '#324BAA' : '#fff',
          color: active === 'execution' ? '#fff' : '#374151',
          borderRadius: 10,
          padding: '7px 10px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        新品執行管理
      </button>
    </div>
  )
}
