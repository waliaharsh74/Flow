
import type React from "react"

import { useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DraggableTokenProps {
  value: string
  path: string
  className?: string
}

export function DraggableToken({ value, path, className }: DraggableTokenProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    const tokenString = `{{${path}}}`
    e.dataTransfer.setData("text/plain", tokenString)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "workflow-token",
        path,
        value,
        token: tokenString,
      }),
    )
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const copyToClipboard = () => {
    const tokenString = `{{${path}}}`
    navigator.clipboard.writeText(tokenString)
  }

  return (
    <div className="inline-flex items-center gap-1 group ">
      <span 
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          "cursor-grab active:cursor-grabbing px-1 py-0.5 rounded text-xs border border-transparent hover:border-border hover:bg-muted/50 transition-colors",
          isDragging && "opacity-50",
          className,
        )}
        title={`Drag to insert {{${path}}}`}
      >
        {value}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
        title={`Copy {{${path}}}`}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  )
}
