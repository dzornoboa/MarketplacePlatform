'use client'

import { useRef, useState } from 'react'
import { uploadSiteImage } from '@/app/editor/builder/actions'
import { isUsableImage } from '@/lib/media/image'

/* Picture field for the editor. Addresses copied from other websites are
   blocked by this site's image policy and break as soon as the other site
   moves the file, so the picture is uploaded into WTC Accra's own storage and
   the stored address is what the form submits. */
export function ImageUploadField({ name, defaultValue, label = 'Picture' }: { name: string; defaultValue?: string | null; label?: string }) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setBusy(true); setError(null)
    const body = new FormData()
    body.set('file', file)
    const result = await uploadSiteImage(body)
    setBusy(false)
    if (!result.ok) { setError(result.error); return }
    setUrl(result.data?.url ?? '')
  }

  const usable = isUsableImage(url)
  return <div className="form-stack">
    <label>{label}
      <input type="hidden" name={name} value={url} />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy}
        onChange={event => { const file = event.target.files?.[0]; if (file) upload(file) }} />
    </label>
    {busy && <p className="field-help">Uploading…</p>}
    {error && <div className="alert alert-error">{error}</div>}
    {url && !usable && <div className="alert alert-error">
      This picture was linked from another website, so it never loads for readers. Upload the file itself, or remove it.
    </div>}
    {url && <div className="button-row">
      {usable && <img src={url} alt="" style={{ maxHeight: 96, borderRadius: 8 }} />}
      <button className="button button-outline" type="button" onClick={() => { setUrl(''); setError(null); if (fileRef.current) fileRef.current.value = '' }}>Remove picture</button>
    </div>}
    <p className="field-help">JPG, PNG, WebP or GIF, up to 8 MB. The picture is stored on WTC Accra&rsquo;s own servers.</p>
  </div>
}
