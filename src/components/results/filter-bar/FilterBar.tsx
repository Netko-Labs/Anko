import { Plus, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { FilterBarProps } from '@/components/results/definitions'
import { FILTER_OPERATORS } from '@/components/results/definitions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { filterLogger } from '@/lib/debug'
import type { FilterCondition, FilterOperator } from '@/types'

export const FilterBar = memo(function FilterBar({
  columns,
  filters,
  onFiltersChange,
  startSlot,
}: FilterBarProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('equals')
  const [filterValue, setFilterValue] = useState('')

  const isNullOperator = selectedOperator === 'is_null' || selectedOperator === 'is_not_null'

  const handleAddFilter = () => {
    if (!selectedColumn) return
    if (!isNullOperator && !filterValue) return

    const newFilter: FilterCondition = {
      column: selectedColumn,
      operator: selectedOperator,
      value: isNullOperator ? '' : filterValue,
    }

    filterLogger.debug('filter added', {
      column: selectedColumn,
      operator: selectedOperator,
      value: isNullOperator ? null : filterValue,
    })
    onFiltersChange([...filters, newFilter])
    setSelectedColumn('')
    setSelectedOperator('equals')
    setFilterValue('')
  }

  const handleRemoveFilter = (index: number) => {
    const removedFilter = filters[index]
    filterLogger.debug('filter removed', {
      column: removedFilter.column,
      operator: removedFilter.operator,
    })
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddFilter()
    }
  }

  const getOperatorLabel = (op: FilterOperator) => {
    return FILTER_OPERATORS.find((operator) => operator.value === op)?.label || op
  }

  if (columns.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-border bg-card">
      {/* Add filter controls */}
      <div className="flex items-center gap-1 min-w-0">
        {startSlot}
        <Select value={selectedColumn} onValueChange={(v) => setSelectedColumn(v ?? '')}>
          <SelectTrigger className="h-7 w-32 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col.name} value={col.name} className="text-xs">
                {col.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedOperator}
          onValueChange={(v) => setSelectedOperator(v as FilterOperator)}
        >
          <SelectTrigger className="h-7 w-24 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPERATORS.map((operator) => (
              <SelectItem key={operator.value} value={operator.value} className="text-xs">
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!isNullOperator && (
          <Input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Value"
            className="h-7 flex-1 min-w-24 text-xs"
          />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFilter}
          disabled={!selectedColumn || (!isNullOperator && !filterValue)}
          className="h-7 w-7 p-0 text-primary/70 hover:text-primary hover:bg-primary/10 disabled:opacity-30 shrink-0"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {/* Active filter chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-0.5 bg-background border border-border rounded text-xs"
            >
              <span className="text-foreground">{filter.column}</span>
              <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
              {filter.value && <span className="text-primary">'{filter.value}'</span>}
              <button
                type="button"
                onClick={() => handleRemoveFilter(index)}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
