'use server'
import { GroupController } from '@/lib/GroupController'
import { DBMgr } from '@/lib/DBMgr'

// Example POST handler for group creation
export async function POST(req: Request) {
  const { name, description, courses, visibility, creator } = await req.json()
  const controller = new GroupController(new DBMgr())
  try {
    const msg = await controller.createGroup(name, description, courses, visibility, creator)
    return new Response(JSON.stringify({ message: msg.message }), { status: 201 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 })
  }
}
