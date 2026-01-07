import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Task } from '../data/schema'

interface DependencyArrowsProps {
  tasks: Task[]
  taskRows: Array<{ task: Task; index: number }>
  containerId: string
}

export function DependencyArrows({ tasks, taskRows, containerId }: DependencyArrowsProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Pulisci tutto

    const containerRect = containerRef.current.getBoundingClientRect()
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:25',message:'DependencyArrows container dimensions',data:{containerWidth:containerRect.width,containerHeight:containerRect.height,containerLeft:containerRect.left,containerTop:containerRect.top},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    svg.attr('width', containerRect.width).attr('height', containerRect.height)

    // Ottieni il colore primario dal CSS
    // Prova a ottenere il colore risolto direttamente da un elemento
    const testElement = document.createElement('div')
    testElement.style.color = 'hsl(var(--primary))'
    document.body.appendChild(testElement)
    const computedColor = getComputedStyle(testElement).color
    document.body.removeChild(testElement)
    
    // Se non funziona, usa un colore di fallback
    const strokeColor = computedColor && computedColor !== 'rgba(0, 0, 0, 0)' ? computedColor : '#3b82f6'

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:40',message:'DependencyArrows color resolved',data:{computedColor,strokeColor},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion

    // Crea i defs una sola volta per tutti i marker
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
      .attr('fill', strokeColor)
      .attr('stroke', strokeColor)

    // Crea un percorso curvo usando d3
    const line = d3
      .line<[number, number]>()
      .curve(d3.curveBasis)
      .x((d: [number, number]) => d[0])
      .y((d: [number, number]) => d[1])

    // Disegna tutte le frecce
    let pathsCreated = 0
    tasks.forEach((task) => {
      if (task.dipendenze.length === 0) return

      task.dipendenze.forEach((dependencyId) => {
        const dependencyTask = tasks.find((t) => t.id === dependencyId)
        if (!dependencyTask) return

        const startElement = document.getElementById(`task-end-${dependencyTask.id}`)
        const endElement = document.getElementById(`task-start-${task.id}`)

        if (!startElement || !endElement) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:45',message:'DependencyArrows elements not found',data:{fromTaskId:dependencyTask.id,toTaskId:task.id,startElementFound:!!startElement,endElementFound:!!endElement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          return
        }

        const startRect = startElement.getBoundingClientRect()
        const endRect = endElement.getBoundingClientRect()

        const startX = startRect.left - containerRect.left + startRect.width / 2
        const startY = startRect.top - containerRect.top + startRect.height / 2
        const endX = endRect.left - containerRect.left + endRect.width / 2
        const endY = endRect.top - containerRect.top + endRect.height / 2

        const dx = endX - startX
        const controlOffset = Math.max(50, Math.abs(dx) * 0.3)

        const pathData: [number, number][] = [
          [startX, startY],
          [startX + controlOffset, startY],
          [endX - controlOffset, endY],
          [endX, endY],
        ]

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:70',message:'DependencyArrows drawing line',data:{fromTaskId:dependencyTask.id,toTaskId:task.id,startX,startY,endX,endY,pathData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        const pathElement = svg
          .append('path')
          .datum(pathData)
          .attr('d', line)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', 2)
          .attr('opacity', 0.9)
          .attr('marker-end', 'url(#arrowhead)')
          .attr('data-from-task', dependencyTask.id)
          .attr('data-to-task', task.id)

        pathsCreated++
        
        // #region agent log
        const pathNode = pathElement.node()
        fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:85',message:'DependencyArrows path created',data:{fromTaskId:dependencyTask.id,toTaskId:task.id,pathCreated:!!pathNode,svgWidth:svg.attr('width'),svgHeight:svg.attr('height'),containerWidth:containerRect.width,containerHeight:containerRect.height,pathsCreated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      })
    })

    // #region agent log
    const allPaths = svg.selectAll('path').nodes()
    fetch('http://127.0.0.1:7242/ingest/df847be0-25f0-4c0b-ba0a-7bc1fdb8a606',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dependency-arrows.tsx:95',message:'DependencyArrows all paths created',data:{totalPaths:allPaths.length,svgWidth:svg.attr('width'),svgHeight:svg.attr('height'),containerWidth:containerRect.width,containerHeight:containerRect.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }, [tasks, taskRows, containerId])

  // Funzione per aggiornare tutte le frecce
  const updateArrows = () => {
    if (!svgRef.current || !containerRef.current) return

    const svg = d3.select(svgRef.current)
    const containerRect = containerRef.current.getBoundingClientRect()
    svg.attr('width', containerRect.width).attr('height', containerRect.height)

    // Ricalcola tutte le posizioni
    const line = d3
      .line<[number, number]>()
      .curve(d3.curveBasis)
      .x((d: [number, number]) => d[0])
      .y((d: [number, number]) => d[1])

    svg.selectAll('path').each(function () {
      const path = d3.select(this)
      const fromTaskId = path.attr('data-from-task')
      const toTaskId = path.attr('data-to-task')

      if (!fromTaskId || !toTaskId) return

      const startElement = document.getElementById(`task-end-${fromTaskId}`)
      const endElement = document.getElementById(`task-start-${toTaskId}`)

      if (!startElement || !endElement) return

      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()

      const startX = startRect.left - containerRect.left + startRect.width / 2
      const startY = startRect.top - containerRect.top + startRect.height / 2
      const endX = endRect.left - containerRect.left + endRect.width / 2
      const endY = endRect.top - containerRect.top + endRect.height / 2

      const dx = endX - startX
      const controlOffset = Math.max(50, Math.abs(dx) * 0.3)

      const pathData: [number, number][] = [
        [startX, startY],
        [startX + controlOffset, startY],
        [endX - controlOffset, endY],
        [endX, endY],
      ]

      path.datum(pathData).attr('d', line)
    })
  }

  // Aggiorna quando la finestra viene ridimensionata o quando i task cambiano
  useEffect(() => {
    const handleResize = () => {
      updateArrows()
    }

    window.addEventListener('resize', handleResize)
    // Trigger immediato per aggiornare dopo il mount e quando i task cambiano
    const timeoutId = setTimeout(updateArrows, 100)
    // Aggiorna anche durante il drag (polling)
    const intervalId = setInterval(updateArrows, 100)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [tasks, taskRows])

  return (
    <div
      ref={containerRef}
      id={containerId}
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

