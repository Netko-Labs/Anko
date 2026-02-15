import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { parseConnectionUrl } from '@/lib/connection-utils'
import { formatErrorMessage } from '@/lib/error-utils'
import {
  addConnectionToWorkspace,
  saveConnection,
  testConnection,
  updateConnection,
} from '@/lib/tauri'
import { ensureMinimumToastDuration } from '@/lib/toast-utils'
import { useConnectionStore } from '@/stores/connection'
import type { ConnectionConfig, ConnectionInfo, DatabaseDriver } from '@/types'
import { DEFAULT_PORTS, DEFAULT_USERS, type InputMode } from '@/components/connection/definitions'

type OperationState =
  | { type: 'idle' }
  | { type: 'testing' }
  | { type: 'saving' }
  | { type: 'test_success' }
  | { type: 'test_error'; message: string }
  | { type: 'save_error'; message: string }

interface UseConnectionFormParams {
  open: boolean
  editConnection?: ConnectionInfo
  workspaceId?: string | null
  onOpenChange: (open: boolean) => void
  onConnectionAdded?: () => void
}

export function useConnectionForm({
  open,
  editConnection,
  workspaceId,
  onOpenChange,
  onConnectionAdded,
}: UseConnectionFormParams) {
  const addSavedConnection = useConnectionStore((s) => s.addSavedConnection)
  const [operationState, setOperationState] = useState<OperationState>({ type: 'idle' })
  const [connectionUrl, setConnectionUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>('form')

  const getDefaultFormData = useCallback(
    (driver: DatabaseDriver = 'mysql'): ConnectionConfig => ({
      name: '',
      host: 'localhost',
      port: DEFAULT_PORTS[driver],
      username: DEFAULT_USERS[driver],
      password: '',
      database: '',
      driver,
    }),
    [],
  )

  const [formData, setFormData] = useState<ConnectionConfig>(() => {
    if (editConnection) {
      return {
        name: editConnection.name,
        host: editConnection.host,
        port: editConnection.port,
        username: editConnection.username,
        password: '',
        database: editConnection.database ?? '',
        driver: editConnection.driver,
      }
    }
    return getDefaultFormData()
  })

  // Reset form when dialog opens/closes or edit connection changes
  useEffect(() => {
    if (open) {
      if (editConnection) {
        setFormData({
          name: editConnection.name,
          host: editConnection.host,
          port: editConnection.port,
          username: editConnection.username,
          password: '',
          database: editConnection.database ?? '',
          driver: editConnection.driver,
        })
      } else {
        setFormData(getDefaultFormData())
      }
      setConnectionUrl('')
      setUrlError(null)
      setOperationState({ type: 'idle' })
      setInputMode('form')
    }
  }, [open, editConnection, getDefaultFormData])

  const handleChange = (field: keyof ConnectionConfig, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setOperationState({ type: 'idle' })
  }

  const handleDriverChange = (driver: DatabaseDriver) => {
    setFormData((prev) => ({
      ...prev,
      driver,
      port: DEFAULT_PORTS[driver],
      username:
        prev.username === DEFAULT_USERS[prev.driver] ? DEFAULT_USERS[driver] : prev.username,
    }))
    setOperationState({ type: 'idle' })
  }

  const handleUrlImport = () => {
    setUrlError(null)
    const parsed = parseConnectionUrl(connectionUrl.trim())
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        ...parsed,
      }))
      setInputMode('form')
      setConnectionUrl('')
    } else {
      setUrlError(
        'Invalid connection URL. Expected format: mysql://user:password@host:port/database',
      )
    }
  }

  const handleTest = async () => {
    setOperationState({ type: 'testing' })

    const startTime = Date.now()
    const toastId = toast.loading('Testing connection...', {
      description: `Attempting to connect to ${formData.host}:${formData.port}`,
    })

    try {
      await testConnection(formData)
      setOperationState({ type: 'test_success' })

      await ensureMinimumToastDuration(startTime)
      toast.success('Connected', {
        id: toastId,
        description: `${formData.host}:${formData.port}`,
      })
    } catch (e) {
      const message = formatErrorMessage(e)
      setOperationState({ type: 'test_error', message })

      toast.error('Connection failed', {
        id: toastId,
        description: message,
      })
    }
  }

  const handleSave = async () => {
    setOperationState({ type: 'saving' })

    try {
      if (editConnection) {
        await updateConnection(editConnection.id, formData)
        toast.success('Connection updated', {
          description: `"${formData.name}" has been updated`,
        })
      } else {
        const saved = await saveConnection(formData)
        addSavedConnection(saved)

        if (workspaceId) {
          await addConnectionToWorkspace(workspaceId, saved.id)
          onConnectionAdded?.()
        }
        toast.success('Connection saved', {
          description: `"${formData.name}" has been added`,
        })
      }
      onOpenChange(false)
    } catch (e) {
      const message = formatErrorMessage(e)
      setOperationState({ type: 'save_error', message })
      toast.error('Failed to save connection', {
        description: message,
      })
    }
  }

  return {
    formData,
    operationState,
    connectionUrl,
    setConnectionUrl,
    urlError,
    setUrlError,
    inputMode,
    setInputMode,
    handleChange,
    handleDriverChange,
    handleUrlImport,
    handleTest,
    handleSave,
  }
}
