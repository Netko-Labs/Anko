import { IconPalette, IconX } from '@tabler/icons-react'
import { NodeResizer, type NodeProps } from '@xyflow/react'
import { memo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ERD_NOTE_COLORS, type ErdNoteNodeData } from './definitions'

/** A resizable, editable, recolorable sticky note placed on the ERD canvas. */
function ErdNoteNodeComponent({ data, selected }: NodeProps) {
  const { id, text, color, onChange, onColor, onDelete } = data as ErdNoteNodeData
  // Local text so typing doesn't depend on a graph rebuild (which would steal focus).
  const [value, setValue] = useState(text)

  return (
    <div
      className="h-full w-full rounded-md border border-black/10 shadow-sm flex flex-col"
      style={{ background: color ?? '#fef9c3' }}
    >
      <NodeResizer minWidth={120} minHeight={80} isVisible={selected} />
      <div className="flex items-center justify-end gap-0.5 px-1 pt-0.5 text-black/50">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:text-black/80 nodrag"
            render={<button type="button" title="Note color" />}
          >
            <IconPalette className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="flex gap-1 p-1.5">
            {ERD_NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => onColor(id, c)}
                className="size-4 rounded-full border border-black/10 hover:scale-110 transition-transform"
                style={{ background: c }}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          title="Delete note"
          onClick={() => onDelete(id)}
          className="hover:text-black/80 nodrag"
        >
          <IconX className="size-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onChange(id, e.target.value)
        }}
        placeholder="Note…"
        className="flex-1 resize-none bg-transparent px-2 pb-2 text-[11px] text-black/80 outline-none placeholder:text-black/30 nodrag"
      />
    </div>
  )
}

export const ErdNoteNode = memo(ErdNoteNodeComponent)
