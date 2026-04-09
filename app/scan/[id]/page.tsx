import { ScanScreen } from '@/components/report/ScanScreen'

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ScanScreen id={id} />
}
