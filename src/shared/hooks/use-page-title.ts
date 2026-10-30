import { useEffect } from 'react'

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Kurio`
    return () => {
      document.title = previousTitle
    }
  }, [title])

  useEffect(() => {
    if (description === undefined) return

    const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const meta = existing ?? document.createElement('meta')
    const previousContent = meta.getAttribute('content')
    if (!existing) {
      meta.name = 'description'
      document.head.append(meta)
    }
    meta.content = description

    return () => {
      if (!existing) meta.remove()
      else if (previousContent === null) meta.removeAttribute('content')
      else meta.content = previousContent
    }
  }, [description])
}
