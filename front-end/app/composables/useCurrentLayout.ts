// composables/useCurrentLayout.ts
export type AppLayout = 'default' | 'admin' | 'user' | 'mod'

export const useCurrentLayout = () => {
  return useState<AppLayout>('currentLayout', () => 'default')
}
