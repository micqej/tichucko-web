import { getSetting } from '@/lib/settings'
import type { NextRequest } from 'next/server'

// Worker si odtiaľto číta časy spúšťania (editovateľné v admine). Chránené CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return Response.json({
    generateTime: (await getSetting('generate_time')) || '08:00',
    sendTime: (await getSetting('send_time')) || '17:00',
    tz: 'Europe/Bratislava',
  })
}
