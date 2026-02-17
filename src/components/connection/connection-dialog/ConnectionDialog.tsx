import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConnectionForm } from '@/hooks/useConnectionForm'
import type { DatabaseDriver } from '@/types'
import { type ConnectionDialogProps, DEFAULT_PORTS, DEFAULT_USERS } from '../definitions'

export function ConnectionDialog({
  open,
  onOpenChange,
  editConnection,
  workspaceId,
  onConnectionAdded,
}: ConnectionDialogProps) {
  const {
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
  } = useConnectionForm({ open, editConnection, workspaceId, onOpenChange, onConnectionAdded })

  const driverLabel = formData.driver === 'mysql' ? 'MySQL' : 'PostgreSQL'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editConnection ? 'Edit Connection' : 'New Connection'}</DialogTitle>
          <DialogDescription>Configure your {driverLabel} database connection.</DialogDescription>
        </DialogHeader>

        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'form' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Manual</TabsTrigger>
            <TabsTrigger value="url">Connection URL</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <label htmlFor="connection-url" className="text-sm font-medium">
                Connection URL
              </label>
              <Input
                id="connection-url"
                value={connectionUrl}
                onChange={(e) => {
                  setConnectionUrl(e.target.value)
                  setUrlError(null)
                }}
                placeholder="mysql://user:password@localhost:3306/database"
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: mysql://, postgresql://, postgres://
              </p>
              {urlError && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {urlError}
                </div>
              )}
            </div>
            <Button onClick={handleUrlImport} className="w-full">
              Import URL
            </Button>
          </TabsContent>

          <TabsContent value="form" className="space-y-4 pt-4">
            <div className="grid gap-2">
              <label htmlFor="driver" className="text-sm font-medium">
                Database Type
              </label>
              <Select
                value={formData.driver}
                onValueChange={(v) => handleDriverChange(v as DatabaseDriver)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Connection Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="My Database"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <label htmlFor="host" className="text-sm font-medium">
                  Host
                </label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="port" className="text-sm font-medium">
                  Port
                </label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    handleChange(
                      'port',
                      Number.parseInt(e.target.value, 10) || DEFAULT_PORTS[formData.driver],
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder={DEFAULT_USERS[formData.driver]}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="database" className="text-sm font-medium">
                Database (optional)
              </label>
              <Input
                id="database"
                value={formData.database ?? ''}
                onChange={(e) => handleChange('database', e.target.value)}
                placeholder="mydb"
              />
            </div>

            {(operationState.type === 'test_error' || operationState.type === 'save_error') && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {operationState.message}
              </div>
            )}

            {operationState.type === 'test_success' && (
              <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                Connection successful!
              </div>
            )}
          </TabsContent>
        </Tabs>

        {inputMode === 'form' && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={operationState.type === 'testing' || operationState.type === 'saving'}
            >
              {operationState.type === 'testing' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {operationState.type === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={operationState.type === 'saving' || !formData.name}
            >
              {operationState.type === 'saving' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {operationState.type === 'saving' ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
