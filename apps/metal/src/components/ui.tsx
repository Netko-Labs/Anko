import { Text, TextInput, View } from '@mirinjs/metal'
import type { ReactNode } from 'react'
import { theme } from '../theme'

export function SectionHeader({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 11, fontWeight: 'semibold' }}>{children}</Text>
      {right}
    </View>
  )
}

export function Button({
  label,
  onPress,
  tone = 'default',
  disabled = false,
  testID,
  small = false,
}: {
  label: string
  onPress: () => void
  tone?: 'default' | 'accent' | 'danger'
  disabled?: boolean
  testID?: string
  small?: boolean
}) {
  const background = disabled
    ? theme.raised
    : tone === 'accent'
      ? theme.accent
      : tone === 'danger'
        ? '#3f1d2a'
        : theme.raised
  const color = disabled
    ? theme.faint
    : tone === 'accent'
      ? theme.accentText
      : tone === 'danger'
        ? theme.error
        : theme.text
  return (
    <View
      onPress={() => {
        if (!disabled) onPress()
      }}
      testID={testID}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: small ? 10 : 14,
        paddingVertical: small ? 4 : 7,
        borderRadius: 6,
        backgroundColor: background,
        hoverBackgroundColor: disabled ? undefined : tone === 'accent' ? '#f472b6' : theme.hover,
      }}
    >
      <Text style={{ color, fontSize: small ? 11 : 12, fontWeight: 'semibold' }}>{label}</Text>
    </View>
  )
}

export function IconButton({
  glyph,
  onPress,
  testID,
  active = false,
}: {
  glyph: string
  onPress: () => void
  testID?: string
  active?: boolean
}) {
  return (
    <View
      onPress={onPress}
      testID={testID}
      style={{
        width: 26,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: active ? theme.raised : undefined,
        hoverBackgroundColor: theme.hover,
      }}
    >
      <Text style={{ color: active ? theme.accent : theme.muted, fontSize: 13 }}>{glyph}</Text>
    </View>
  )
}

export const fieldStyle = {
  color: theme.text,
  placeholderColor: theme.faint,
  backgroundColor: theme.input,
  borderColor: theme.panelBorder,
  focusBorderColor: theme.accent,
  borderRadius: 6,
  padding: 8,
  fontSize: 12,
} as const

export function Field({
  label,
  value,
  placeholder,
  onChange,
  onSubmit,
  mono = false,
  secure = false,
  testID,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (text: string) => void
  onSubmit?: () => void
  mono?: boolean
  secure?: boolean
  testID?: string
}) {
  return (
    <View style={{ flexDirection: 'column', gap: 4, flex: 1 }}>
      <Text style={{ color: theme.muted, fontSize: 11 }}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        secureTextEntry={secure}
        style={{ ...fieldStyle, fontFamily: mono ? 'monospace' : 'default' }}
        testID={testID}
      />
    </View>
  )
}

export function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string
  selected: boolean
  onPress: () => void
  testID?: string
}) {
  return (
    <View
      onPress={onPress}
      testID={testID}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.panelBorder,
        backgroundColor: selected ? '#2a1420' : undefined,
        hoverBackgroundColor: theme.hover,
      }}
    >
      <Text
        style={{ color: selected ? theme.accent : theme.muted, fontSize: 11, fontWeight: 'medium' }}
      >
        {label}
      </Text>
    </View>
  )
}

export function Empty({ children }: { children: string }) {
  return (
    <View style={{ padding: 16, alignItems: 'center' }}>
      <Text style={{ color: theme.faint, fontSize: 12 }}>{children}</Text>
    </View>
  )
}
