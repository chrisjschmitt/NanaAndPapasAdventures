import { useMemo } from 'react'

interface JigsawPieceProps {
  row: number
  col: number
  size: number
  children: React.ReactNode
  solved: boolean
  onClick: () => void
  disabled: boolean
  testId: string
}

type Edge = 'tab' | 'blank' | 'flat'

function getEdges(row: number, col: number): { top: Edge; right: Edge; bottom: Edge; left: Edge } {
  const top: Edge = row === 0 ? 'flat' : (row + col) % 2 === 0 ? 'tab' : 'blank'
  const bottom: Edge = row === 2 ? 'flat' : (row + col) % 2 === 0 ? 'blank' : 'tab'
  const left: Edge = col === 0 ? 'flat' : (row + col) % 2 === 0 ? 'tab' : 'blank'
  const right: Edge = col === 2 ? 'flat' : (row + col) % 2 === 0 ? 'blank' : 'tab'
  return { top, right, bottom, left }
}

function buildJigsawPath(
  size: number,
  edges: { top: Edge; right: Edge; bottom: Edge; left: Edge }
): string {
  const s = size
  const tab = s * 0.15
  const neck = s * 0.08
  const parts: string[] = []

  parts.push(`M 0 0`)

  if (edges.top === 'flat') {
    parts.push(`L ${s} 0`)
  } else if (edges.top === 'tab') {
    parts.push(`L ${s * 0.35} 0`)
    parts.push(`L ${s * 0.35} ${-neck}`)
    parts.push(`C ${s * 0.35 - tab} ${-neck - tab}, ${s * 0.65 - tab} ${-neck - tab}, ${s * 0.65} ${-neck}`)
    parts.push(`L ${s * 0.65} 0`)
    parts.push(`L ${s} 0`)
  } else {
    parts.push(`L ${s * 0.35} 0`)
    parts.push(`L ${s * 0.35} ${neck}`)
    parts.push(`C ${s * 0.35 - tab} ${neck + tab}, ${s * 0.65 - tab} ${neck + tab}, ${s * 0.65} ${neck}`)
    parts.push(`L ${s * 0.65} 0`)
    parts.push(`L ${s} 0`)
  }

  if (edges.right === 'flat') {
    parts.push(`L ${s} ${s}`)
  } else if (edges.right === 'tab') {
    parts.push(`L ${s} ${s * 0.35}`)
    parts.push(`L ${s + neck} ${s * 0.35}`)
    parts.push(`C ${s + neck + tab} ${s * 0.35 - tab}, ${s + neck + tab} ${s * 0.65 - tab}, ${s + neck} ${s * 0.65}`)
    parts.push(`L ${s} ${s * 0.65}`)
    parts.push(`L ${s} ${s}`)
  } else {
    parts.push(`L ${s} ${s * 0.35}`)
    parts.push(`L ${s - neck} ${s * 0.35}`)
    parts.push(`C ${s - neck - tab} ${s * 0.35 - tab}, ${s - neck - tab} ${s * 0.65 - tab}, ${s - neck} ${s * 0.65}`)
    parts.push(`L ${s} ${s * 0.65}`)
    parts.push(`L ${s} ${s}`)
  }

  if (edges.bottom === 'flat') {
    parts.push(`L 0 ${s}`)
  } else if (edges.bottom === 'tab') {
    parts.push(`L ${s * 0.65} ${s}`)
    parts.push(`L ${s * 0.65} ${s + neck}`)
    parts.push(`C ${s * 0.65 + tab} ${s + neck + tab}, ${s * 0.35 + tab} ${s + neck + tab}, ${s * 0.35} ${s + neck}`)
    parts.push(`L ${s * 0.35} ${s}`)
    parts.push(`L 0 ${s}`)
  } else {
    parts.push(`L ${s * 0.65} ${s}`)
    parts.push(`L ${s * 0.65} ${s - neck}`)
    parts.push(`C ${s * 0.65 + tab} ${s - neck - tab}, ${s * 0.35 + tab} ${s - neck - tab}, ${s * 0.35} ${s - neck}`)
    parts.push(`L ${s * 0.35} ${s}`)
    parts.push(`L 0 ${s}`)
  }

  if (edges.left === 'flat') {
    parts.push(`L 0 0`)
  } else if (edges.left === 'tab') {
    parts.push(`L 0 ${s * 0.65}`)
    parts.push(`L ${-neck} ${s * 0.65}`)
    parts.push(`C ${-neck - tab} ${s * 0.65 + tab}, ${-neck - tab} ${s * 0.35 + tab}, ${-neck} ${s * 0.35}`)
    parts.push(`L 0 ${s * 0.35}`)
    parts.push(`L 0 0`)
  } else {
    parts.push(`L 0 ${s * 0.65}`)
    parts.push(`L ${neck} ${s * 0.65}`)
    parts.push(`C ${neck + tab} ${s * 0.65 + tab}, ${neck + tab} ${s * 0.35 + tab}, ${neck} ${s * 0.35}`)
    parts.push(`L 0 ${s * 0.35}`)
    parts.push(`L 0 0`)
  }

  parts.push('Z')
  return parts.join(' ')
}

export default function JigsawPiece({
  row,
  col,
  size,
  children,
  solved,
  onClick,
  disabled,
  testId,
}: JigsawPieceProps) {
  const edges = useMemo(() => getEdges(row, col), [row, col])
  const clipId = `jigsaw-clip-${row}-${col}`
  const overshoot = size * 0.25
  const viewSize = size + overshoot * 2

  const path = useMemo(() => buildJigsawPath(size, edges), [size, edges])

  return (
    <button
      className={`jigsaw-piece ${solved ? 'solved' : ''}`}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      style={{
        width: viewSize,
        height: viewSize,
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        padding: 0,
        margin: `-${overshoot}px`,
      }}
    >
      <svg
        width={viewSize}
        height={viewSize}
        viewBox={`${-overshoot} ${-overshoot} ${viewSize} ${viewSize}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={-overshoot}
            y={-overshoot}
            width={viewSize}
            height={viewSize}
            fill={solved ? 'rgba(6, 214, 160, 0.12)' : 'rgba(170, 59, 255, 0.07)'}
          />
          <foreignObject x={0} y={0} width={size} height={size}>
            <div
              style={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {children}
            </div>
          </foreignObject>
        </g>
        <path
          d={path}
          fill="none"
          stroke={solved ? '#06d6a0' : '#b8a9d4'}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
