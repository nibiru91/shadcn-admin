import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Task } from '../data/schema'

interface DependencyArrowProps {
  fromTask: Task
  toTask: Task
  rangeStart: Date
  rangeEnd: Date
  rowHeight: number
  fromRowIndex: number
  toRowIndex: number
}

export function DependencyArrow({
  fromTask,
  toTask,
  rangeStart,
  rangeEnd,
  rowHeight,
  fromRowIndex,
  toRowIndex,
}: DependencyArrowProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Pulisci il contenuto precedente

    // Trova gli elementi di riferimento
    const startElement = document.getElementById(`task-end-${fromTask.id}`)
    const endElement = document.getElementById(`task-start-${toTask.id}`)

    if (!startElement || !endElement) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrow.tsx:30',message:'DependencyArrow elements not found',data:{fromTaskId:fromTask.id,toTaskId:toTask.id,startElementFound:!!startElement,endElementFound:!!endElement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return
    }

    // Ottieni le dimensioni del container
    const containerRect = containerRef.current.getBoundingClientRect()
    const startRect = startElement.getBoundingClientRect()
    const endRect = endElement.getBoundingClientRect()

    // Calcola le posizioni relative al container
    const startX = startRect.left - containerRect.left + startRect.width / 2
    const startY = startRect.top - containerRect.top + startRect.height / 2
    const endX = endRect.left - containerRect.left + endRect.width / 2
    const endY = endRect.top - containerRect.top + endRect.height / 2

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrow.tsx:45',message:'DependencyArrow positions calculated',data:{fromTaskId:fromTask.id,toTaskId:toTask.id,startX,startY,endX,endY,containerWidth:containerRect.width,containerHeight:containerRect.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Imposta le dimensioni dell'SVG
    svg.attr('width', containerRect.width).attr('height', containerRect.height)

    // Crea un percorso curvo usando d3
    const line = d3
      .line<[number, number]>()
      .curve(d3.curveBasis)
      .x((d: [number, number]) => d[0])
      .y((d: [number, number]) => d[1])

    // Calcola i punti di controllo per una curva fluida
    const dx = endX - startX
    const controlOffset = Math.max(50, Math.abs(dx) * 0.3)

    const pathData: [number, number][] = [
      [startX, startY],
      [startX + controlOffset, startY],
      [endX - controlOffset, endY],
      [endX, endY],
    ]

    // Disegna la linea
    svg
      .append('path')
      .datum(pathData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .attr('marker-end', 'url(#arrowhead)')

    // Crea il marker per la freccia
    const defs = svg.append('defs')
    const marker = defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .attr('markerUnits', 'strokeWidth')

    marker
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', 'hsl(var(--primary))')
      .attr('stroke', 'hsl(var(--primary))')

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrow.tsx:75',message:'DependencyArrow line drawn',data:{fromTaskId:fromTask.id,toTaskId:toTask.id,pathData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }, [fromTask.id, toTask.id, fromTask.data_fine, toTask.data_inizio, rangeStart, rangeEnd, rowHeight, fromRowIndex, toRowIndex])

  // Aggiorna la linea quando la finestra viene ridimensionata o quando i task vengono spostati
  useEffect(() => {
    const handleResize = () => {
      if (!svgRef.current || !containerRef.current) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()

      const startElement = document.getElementById(`task-end-${fromTask.id}`)
      const endElement = document.getElementById(`task-start-${toTask.id}`)

      if (!startElement || !endElement) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()

      const startX = startRect.left - containerRect.left + startRect.width / 2
      const startY = startRect.top - containerRect.top + startRect.height / 2
      const endX = endRect.left - containerRect.left + endRect.width / 2
      const endY = endRect.top - containerRect.top + endRect.height / 2

      svg.attr('width', containerRect.width).attr('height', containerRect.height)

      const line = d3
        .line<[number, number]>()
        .curve(d3.curveBasis)
        .x((d: [number, number]) => d[0])
        .y((d: [number, number]) => d[1])

      const dx = endX - startX
      const controlOffset = Math.max(50, Math.abs(dx) * 0.3)

      const pathData: [number, number][] = [
        [startX, startY],
        [startX + controlOffset, startY],
        [endX - controlOffset, endY],
        [endX, endY],
      ]

      svg
        .append('path')
        .datum(pathData)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'hsl(var(--primary))')
        .attr('stroke-width', 2)
        .attr('opacity', 0.9)
        .attr('marker-end', 'url(#arrowhead)')

      const defs = svg.append('defs')
      const marker = defs
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 9)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .attr('markerUnits', 'strokeWidth')

      marker
        .append('polygon')
        .attr('points', '0 0, 10 3, 0 6')
        .attr('fill', 'hsl(var(--primary))')
        .attr('stroke', 'hsl(var(--primary))')
    }

    window.addEventListener('resize', handleResize)
    // Trigger immediato per aggiornare dopo il mount
    setTimeout(handleResize, 0)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [fromTask.id, toTask.id, fromTask.data_fine, toTask.data_inizio])

  return (
    <div
      ref={containerRef}
      className='absolute inset-0 pointer-events-none'
      style={{ width: '100%', height: '100%' }}
    >
      <svg
        ref={svgRef}
        className='pointer-events-none absolute inset-0'
        style={{ width: '100%', height: '100%', zIndex: 5 }}
      />
    </div>
  )
}
