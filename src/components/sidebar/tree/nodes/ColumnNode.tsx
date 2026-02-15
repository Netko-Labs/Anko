import { IconColumns, IconKey } from '@tabler/icons-react'
import { memo } from 'react'
import type { ColumnNodeProps } from '../../definitions'
import { TreeNode } from '../TreeNode'

export const ColumnNode = memo(
  function ColumnNode({ column, onClick, level = 3 }: ColumnNodeProps) {
    const isPrimaryKey = column.key === 'PRI'

    return (
      <TreeNode
        label={column.name}
        secondaryLabel={`${column.data_type}${column.nullable ? '' : ' *'}`}
        icon={
          isPrimaryKey ? (
            <IconKey className="size-3 text-primary" />
          ) : (
            <IconColumns className="size-3 text-primary/50" />
          )
        }
        onClick={onClick}
        level={level}
      />
    )
  },
  (prev, next) => {
    return (
      prev.column.name === next.column.name &&
      prev.column.data_type === next.column.data_type &&
      prev.column.nullable === next.column.nullable &&
      prev.column.key === next.column.key &&
      prev.level === next.level &&
      prev.onClick === next.onClick
    )
  },
)
