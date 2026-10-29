import type { ConnectionConfig, ConnectionInfo, DatabaseDriver } from '@anko/desktop-domain'
import { getConnectionConfig } from '@anko/desktop-repository'
import { Text, View } from '@mirinjs/metal'
import { useState } from 'react'
import { theme } from '../theme'
import { Button, Chip, Field } from './ui'

const DRIVERS: { value: DatabaseDriver; label: string; port: number; user: string }[] = [
  { value: 'sqlite', label: 'SQLite', port: 0, user: '' },
  { value: 'postgresql', label: 'PostgreSQL', port: 5432, user: 'postgres' },
  { value: 'mysql', label: 'MySQL', port: 3306, user: 'root' },
]

interface ConnectionFormProps {
  editing: ConnectionInfo | null
  onTest: (config: ConnectionConfig) => Promise<string>
  onSave: (config: ConnectionConfig) => Promise<void>
  onCancel: () => void
}

function initialConfig(editing: ConnectionInfo | null): ConnectionConfig {
  if (editing) {
    try {
      return getConnectionConfig(editing.id)
    } catch {
      // Fall through to the info without a password.
    }
    return { ...editing, password: '', database: editing.database }
  }
  return { name: '', host: '', port: 0, username: '', password: '', driver: 'sqlite' }
}

export function ConnectionForm({ editing, onTest, onSave, onCancel }: ConnectionFormProps) {
  const [config, setConfig] = useState<ConnectionConfig>(() => initialConfig(editing))
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isSqlite = config.driver === 'sqlite'
  const ready = config.name.trim().length > 0 && config.host.trim().length > 0
  const patch = (next: Partial<ConnectionConfig>) =>
    setConfig((current) => ({ ...current, ...next }))

  const pickDriver = (driver: DatabaseDriver) => {
    const defaults = DRIVERS.find((entry) => entry.value === driver)
    if (!defaults) return
    patch({
      driver,
      port: defaults.port,
      username: config.username || defaults.user,
      host: driver === 'sqlite' ? '' : config.host === '' ? 'localhost' : config.host,
    })
  }

  const submit = async () => {
    if (!ready || busy) return
    setBusy(true)
    try {
      await onSave({ ...config, name: config.name.trim(), host: config.host.trim() })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (!ready || busy) return
    setBusy(true)
    setStatus('Testing…')
    setStatus(await onTest(config))
    setBusy(false)
  }

  return (
    <View style={{ flexDirection: 'column', gap: 10, padding: 12 }}>
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'semibold' }}>
        {editing ? 'Edit connection' : 'New connection'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {DRIVERS.map((driver) => (
          <Chip
            key={driver.value}
            label={driver.label}
            selected={config.driver === driver.value}
            onPress={() => pickDriver(driver.value)}
            testID={`driver:${driver.value}`}
          />
        ))}
      </View>
      <Field
        label="Connection name"
        value={config.name}
        placeholder="My Database"
        onChange={(name) => patch({ name })}
        testID="form:name"
      />
      {isSqlite ? (
        <Field
          label="Database file"
          value={config.host}
          placeholder="/path/to/database.db or :memory:"
          onChange={(host) => patch({ host })}
          onSubmit={submit}
          mono
          testID="form:host"
        />
      ) : (
        <View style={{ flexDirection: 'column', gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field
              label="Host"
              value={config.host}
              placeholder="localhost"
              onChange={(host) => patch({ host })}
              mono
              testID="form:host"
            />
            <View style={{ width: 90 }}>
              <Field
                label="Port"
                value={String(config.port || '')}
                onChange={(port) => patch({ port: Number.parseInt(port, 10) || 0 })}
                mono
                testID="form:port"
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field
              label="Username"
              value={config.username}
              onChange={(username) => patch({ username })}
              testID="form:username"
            />
            <Field
              label="Password"
              value={config.password}
              onChange={(password) => patch({ password })}
              secure
              testID="form:password"
            />
          </View>
          <Field
            label="Database (optional)"
            value={config.database ?? ''}
            placeholder="mydb"
            onChange={(database) => patch({ database: database || undefined })}
            onSubmit={submit}
            mono
            testID="form:database"
          />
        </View>
      )}
      {status ? (
        <Text
          style={{
            color: status === 'Connection successful' ? theme.success : theme.error,
            fontSize: 11,
          }}
        >
          {status}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}>
        <Button label="Cancel" onPress={onCancel} testID="form:cancel" />
        <Button label="Test" onPress={test} disabled={!ready || busy} testID="form:test" />
        <Button
          label={editing ? 'Save' : 'Save & connect'}
          tone="accent"
          onPress={submit}
          disabled={!ready || busy}
          testID="form:save"
        />
      </View>
    </View>
  )
}
