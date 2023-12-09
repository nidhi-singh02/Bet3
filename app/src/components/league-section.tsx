import Image from 'next/image'
import { League } from '@/types'

export default function LeagueSection({
  league,
  children,
}: {
  league: League
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[100vw]">
      <div className="mx-4 mb-4 mt-6 flex h-[152px] flex-col items-center justify-center rounded-[8px] bg-[url('/cricket_field2.png')] bg-center bg-no-repeat">
        <Image
          src={league.logo ?? '/na.webp'}
          width={116}
          height={116}
          className="max-h-[116px] max-w-[116px] object-contain"
          alt={league.name ?? 'league-logo'}
        />
      </div>
      {children}
    </div>
  )
}
