import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface Member { member_id:number; name:string; email:string; role:string }
interface Group { id:number; name:string }
export default function Members() {
  const [members,setMembers]=useState<Member[]>([])
  const [group,setGroup]=useState<Group|null>(null)
  useEffect(()=>{(async()=>{const gs=await api<Group[]>('/api/groups'); const g=gs[0]; if(g){setGroup(g);setMembers(await api<Member[]>(`/api/groups/${g.id}/members`))}})()},[])
  return <><div className="page-header"><div><h1>Members</h1><p className="muted">Roster, roles and participation across your njangi.</p></div><button className="primary-button">Invite member</button></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Member ID</th></tr></thead><tbody>{members.map(m=><tr key={m.member_id}><td><strong>{m.name}</strong></td><td>{m.email}</td><td><span className="pill blue">{m.role}</span></td><td>#{m.member_id}</td></tr>)}</tbody></table></div>{!members.length&&<div className="empty">No members in {group?.name || 'this group'} yet.</div>}</section></>
}
