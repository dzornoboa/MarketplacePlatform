'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/lib/auth/guards'
import { reviewDecisionToStatus } from '@/lib/auth/verification'

export async function reviewVerification(formData:FormData){const {supabase}=await requireAdminProfile();const requestId=String(formData.get('requestId')??'');const decision=String(formData.get('decision')??'');const note=String(formData.get('note')??'').trim()||null;if(!requestId||!reviewDecisionToStatus(decision))redirect('/admin/verification?error=Invalid%20verification%20decision.');const {error}=await supabase.rpc('review_verification_request',{request_id:requestId,decision,reviewer_note:note});if(error)redirect(`/admin/verification?error=${encodeURIComponent(error.message)}`);revalidatePath('/admin/verification');revalidatePath('/dashboard','layout');redirect('/admin/verification?message=Verification%20review%20saved.')}
