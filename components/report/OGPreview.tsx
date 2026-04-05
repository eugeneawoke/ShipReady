'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ScanResult } from '@/types/scan'

interface OGPreviewProps {
  result: ScanResult
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  siteName?: string
}

function TwitterCard({
  title,
  description,
  image,
  siteName,
}: {
  title: string
  description: string
  image?: string
  siteName: string
}) {
  return (
    <div className="w-full max-w-[500px] rounded-2xl overflow-hidden border border-white/10 bg-[#161618]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="OG preview" className="w-full aspect-[2/1] object-cover" />
      ) : (
        <div className="w-full aspect-[2/1] bg-[#1E1E21] flex items-center justify-center">
          <ImageOff className="w-8 h-8 text-[#5A5955]" />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-[#5A5955] mb-1">{siteName}</p>
        <p className="text-sm font-medium line-clamp-1">{title || 'No title'}</p>
        <p className="text-xs text-[#8B8A85] line-clamp-2 mt-0.5">
          {description || 'No description'}
        </p>
      </div>
    </div>
  )
}

function TelegramCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image?: string
}) {
  return (
    <div className="w-full max-w-[380px] rounded-xl overflow-hidden border border-white/10 bg-[#161618] flex gap-3 p-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="w-[72px] h-[72px] object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-[72px] h-[72px] bg-[#1E1E21] rounded-lg flex items-center justify-center shrink-0">
          <ImageOff className="w-5 h-5 text-[#5A5955]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2">{title || 'No title'}</p>
        <p className="text-xs text-[#8B8A85] line-clamp-2 mt-1">
          {description || 'No description'}
        </p>
      </div>
    </div>
  )
}

function WhatsAppCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image?: string
}) {
  return (
    <div className="w-full max-w-[320px] rounded-lg overflow-hidden border border-white/10 bg-[#161618] flex gap-2 p-2">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="w-[80px] h-[80px] object-cover rounded shrink-0" />
      ) : (
        <div className="w-[80px] h-[80px] bg-[#1E1E21] rounded flex items-center justify-center shrink-0">
          <ImageOff className="w-4 h-4 text-[#5A5955]" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-1">
        <p className="text-xs font-medium line-clamp-2">{title || 'No title'}</p>
        <p className="text-[11px] text-[#8B8A85] line-clamp-2 mt-0.5">{description || ''}</p>
      </div>
    </div>
  )
}

export function OGPreview({
  result,
  ogTitle = '',
  ogDescription = '',
  ogImage,
  siteName = '',
}: OGPreviewProps) {
  const [tab, setTab] = useState<'twitter' | 'telegram' | 'whatsapp'>('twitter')
  const domain = (() => {
    try {
      return new URL(result.url).hostname
    } catch {
      return result.url
    }
  })()
  const displayName = siteName || domain

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[#8B8A85]">
        How your link appears on social media
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#161618] rounded-lg p-1 w-fit border border-white/6">
        {(['twitter', 'telegram', 'whatsapp'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-[#232328] text-[#F1F0EE]'
                : 'text-[#8B8A85] hover:text-[#F1F0EE]'
            }`}
          >
            {t === 'twitter' ? 'Twitter/X' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex justify-start">
        {tab === 'twitter' && (
          <TwitterCard
            title={ogTitle}
            description={ogDescription}
            image={ogImage}
            siteName={displayName}
          />
        )}
        {tab === 'telegram' && (
          <TelegramCard title={ogTitle} description={ogDescription} image={ogImage} />
        )}
        {tab === 'whatsapp' && (
          <WhatsAppCard title={ogTitle} description={ogDescription} image={ogImage} />
        )}
      </div>
    </div>
  )
}
