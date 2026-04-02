/**
 * app/api/groups/route.ts — Campus Connect: Study Groups API
 * 
 * HTTP API endpoint handler for study group operations.
 * POST /api/groups — creates a new study group
 * GET /api/groups — retrieves all study groups
 * 
 * Request body (POST): {
 *   name: string,           // Group name (required, 1-255 chars)
 *   description: string,    // Optional description
 *   courses: string,        // Comma-separated course codes
 *   visibility: boolean,    // true = public, false = private
 *   creator: string         // User ID of group creator (required)
 * }
 * 
 * Response (201 Created): { message: "Study Group Created" }
 * Response (400 Bad Request): { error: "error message" }
 */

'use server'
import { GroupController } from '@/lib/GroupController'
import { MockDBMgr } from '@/lib/MockDBMgr'

// Use MockDBMgr for local development (no Supabase needed)
// Replace with: import { DBMgr } from '@/lib/DBMgr'
// When ready to connect to Supabase

export async function POST(req: Request) {
  const { name, description, courses, visibility, creator } = await req.json()
  const controller = new GroupController(new MockDBMgr())
  try {
    const msg = await controller.createGroup(name, description, courses, visibility, creator)
    return new Response(JSON.stringify({ message: msg.message }), { status: 201 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 })
  }
}

export async function GET(req: Request) {
  const db = new MockDBMgr()
  try {
    const groups = await db.getStudyGroups()
    return new Response(JSON.stringify({ groups, count: groups.length }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
