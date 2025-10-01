
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DraggableToken } from "@/components/DraggableToken"

interface JsonTreeProps {
  id:string
  data: any
  path?: string
  level?: number
}

export function JsonTree({ data, path = "", level = 0 ,id}: JsonTreeProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderValue = (value: any, key: string, currentPath: string,id) => {
  const basePath = currentPath ? `${currentPath}.${key}` : key;
  const fullPath = id ? `${id}.${basePath}` : basePath;
    if (value === null) {
      return <DraggableToken value="null" path={fullPath} className="text-muted-foreground" />
    }

    if (typeof value === "boolean") {
      return <DraggableToken value={value.toString()} path={fullPath} className="text-blue-600" />
    }

    if (typeof value === "number") {
      return <DraggableToken value={value.toString()} path={fullPath} className="text-green-600" />
    }

    if (typeof value === "string") {
      return <DraggableToken value={`"${value}"`} path={fullPath} className="text-orange-600" />
    }

    if (Array.isArray(value)) {
      const isCollapsed = collapsed[fullPath]
      return (
        <div className="">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleCollapse(fullPath)}>
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <span className="text-muted-foreground">[{value.length}]</span>
          </div>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground min-w-[20px]">{index}:</span>
                  {renderValue(item, index.toString(), basePath,id)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === "object") {
      const keys = Object.keys(value)
      const isCollapsed = collapsed[fullPath]

      return (
        <div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleCollapse(fullPath)}>
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <span className="text-muted-foreground">
              {"{"}
              {keys.length}
              {"}"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              {keys.map((objKey) => (
                <div key={objKey} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px]">{objKey}:</span>
                  {renderValue(value[objKey], objKey, basePath,id)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return <DraggableToken value={String(value)} path={fullPath} />
  }

  return (
    <div className="font-mono text-xs">
      {typeof data === "object" && data !== null
        ? Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 mb-1">
              <span className="text-muted-foreground min-w-[60px]">{key}:</span>
              {renderValue(value, key, path,id)}
            </div>
          ))
        : renderValue(data, "", path,id)}
    </div>
  )
}
