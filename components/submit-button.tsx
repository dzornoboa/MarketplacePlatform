'use client'

import { useFormStatus } from 'react-dom'
import type { ReactNode } from 'react'

/* A plain <button type="submit"> in a server-action form can be clicked
   twice before the first submission redirects — which is how a member ended
   up with two copies of the same listing three seconds apart. This one
   disables itself while the form is pending. Works inside any <form action>. */
export function SubmitButton({
  children, className = 'button button-primary', pendingLabel = 'Saving…', name, value,
}: { children: ReactNode; className?: string; pendingLabel?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus()
  return <button className={className} type="submit" name={name} value={value} disabled={pending} aria-busy={pending}>
    {pending ? pendingLabel : children}
  </button>
}
