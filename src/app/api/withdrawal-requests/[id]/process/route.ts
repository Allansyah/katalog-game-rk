// import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';
// import { Role, WithdrawalStatus, LogType, ActivityAction } from '@prisma/client';
// import { db } from '@/lib/db';
// import { logActivityWithContext } from '@/lib/activity';

// // POST - Process withdrawal request (approve/reject)
// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const token = await getToken({ req: request });

//     if (!token || token.role !== Role.SUPER_ADMIN) {
//       return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
//     }

//     const { id } = await params;
//     const body = await request.json();
//     const { action, adminNotes } = body;

//     if (!action || !['approve', 'reject'].includes(action)) {
//       return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
//     }

//     const withdrawal = await db.withdrawalRequest.findUnique({
//       where: { id },
//       include: { user: true },
//     });

//     if (!withdrawal) {
//       return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
//     }

//     if (withdrawal.status !== WithdrawalStatus.PENDING) {
//       return NextResponse.json(
//         { error: `Withdrawal already ${withdrawal.status.toLowerCase()}` },
//         { status: 400 }
//       );
//     }

//     if (action === 'approve') {
//       // Approve - balance already deducted when request was created
//       const updated = await db.withdrawalRequest.update({
//         where: { id },
//         data: {
//           status: WithdrawalStatus.APPROVED,
//           adminNotes,
//           processedAt: new Date(),
//           processedBy: token.id as string,
//         },
//       });

//       // Log activity
//       await logActivityWithContext({
//         action: ActivityAction.WITHDRAW_APPROVE,
//         userId: token.id as string,
//         entityType: 'WithdrawalRequest',
//         entityId: id,
//         details: {
//           amount: withdrawal.amount,
//           targetUserId: withdrawal.userId,
//           targetUserName: withdrawal.user.name,
//           type: withdrawal.type,
//         },
//       }, request);

//       return NextResponse.json({
//         withdrawal: updated,
//         message: 'Withdrawal approved',
//       });
//     } else {
//       // Reject - refund the balance
//       const result = await db.$transaction(async (tx) => {
//         // Refund balance
//         const updateField = withdrawal.source === 'balance' ? 'balance' : 'salesBalance';
//         await tx.user.update({
//           where: { id: withdrawal.userId },
//           data: {
//             [updateField]: { increment: withdrawal.amount },
//           },
//         });

//         // Update withdrawal status
//         const updated = await tx.withdrawalRequest.update({
//           where: { id },
//           data: {
//             status: WithdrawalStatus.REJECTED,
//             adminNotes,
//             processedAt: new Date(),
//             processedBy: token.id as string,
//           },
//         });

//         // Create balance log for refund
//         await tx.balanceLog.create({
//           data: {
//             userId: withdrawal.userId,
//             amount: withdrawal.amount,
//             type: LogType.WITHDRAWAL,
//             description: `Withdrawal rejected - refunded`,
//           },
//         });

//         return updated;
//       });

//       // Log activity
//       await logActivityWithContext({
//         action: ActivityAction.WITHDRAW_REJECT,
//         userId: token.id as string,
//         entityType: 'WithdrawalRequest',
//         entityId: id,
//         details: {
//           amount: withdrawal.amount,
//           targetUserId: withdrawal.userId,
//           targetUserName: withdrawal.user.name,
//           reason: adminNotes,
//         },
//       }, request);

//       return NextResponse.json({
//         withdrawal: result,
//         message: 'Withdrawal rejected and balance refunded',
//       });
//     }
//   } catch (error) {
//     console.error('Error processing withdrawal:', error);
//     return NextResponse.json(
//       { error: 'Failed to process withdrawal' },
//       { status: 500 }
//     );
//   }
// }



import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role, WithdrawalStatus, LogType, ActivityAction } from '@prisma/client';
import { db } from '@/lib/db';
import { logActivityWithContext } from '@/lib/activity';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token || token.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { id } = await params;
    
    // Ubah dari request.json() ke request.formData()
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const adminNotes = formData.get('adminNotes') as string;
    const file = formData.get('file') as File | null;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const withdrawal = await db.withdrawalRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      return NextResponse.json(
        { error: `Withdrawal already ${withdrawal.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    let imageUrl = withdrawal.imageUrl; // Keep existing image if any

    // Handle File Upload hanya jika action APPROVE (karena bukti tf biasanya saat approve)
    // Atau bisa juga jika admin ingin menyimpan bukti penolakan, tapi disini kita fokus saat approve
    if (action === 'approve' && file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Buat nama file unik
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `proof-${withdrawal.id}-${Date.now()}.${ext}`;
      
      // Path tujuan: public/uploads/bukti-tf
      const publicDir = path.join(process.cwd(), 'public/uploads/bukti-tf');
      
      // Cek dan buat folder jika belum ada
      if (!existsSync(publicDir)) {
        await mkdir(publicDir, { recursive: true });
      }

      const filePath = path.join(publicDir, fileName);
      
      // Tulis file
      await writeFile(filePath, buffer);
      
      // Simpan path relatif ke database (agar bisa diakses via web)
      imageUrl = `/uploads/bukti-tf/${fileName}`;
    }

    if (action === 'approve') {
      const updated = await db.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.APPROVED,
          adminNotes,
          processedAt: new Date(),
          processedBy: token.id as string,
          imageUrl: imageUrl, // Update dengan URL gambar baru (jika ada)
        },
      });

      await logActivityWithContext({
        action: ActivityAction.WITHDRAW_APPROVE,
        userId: token.id as string,
        entityType: 'WithdrawalRequest',
        entityId: id,
        details: {
          amount: withdrawal.amount,
          targetUserId: withdrawal.userId,
          targetUserName: withdrawal.user.name,
          type: withdrawal.type,
          proofUploaded: !!file
        },
      }, request);

      return NextResponse.json({
        withdrawal: updated,
        message: 'Withdrawal approved',
      });
    } else {
      // Reject Logic
      const result = await db.$transaction(async (tx) => {
        const updateField = withdrawal.source === 'balance' ? 'balance' : 'salesBalance';
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            [updateField]: { increment: withdrawal.amount },
          },
        });

        const updated = await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: WithdrawalStatus.REJECTED,
            adminNotes,
            processedAt: new Date(),
            processedBy: token.id as string,
          },
        });

        await tx.balanceLog.create({
          data: {
            userId: withdrawal.userId,
            amount: withdrawal.amount,
            type: LogType.WITHDRAWAL,
            description: `Withdrawal rejected - refunded`,
          },
        });

        return updated;
      });

      await logActivityWithContext({
        action: ActivityAction.WITHDRAW_REJECT,
        userId: token.id as string,
        entityType: 'WithdrawalRequest',
        entityId: id,
        details: {
          amount: withdrawal.amount,
          targetUserId: withdrawal.userId,
          targetUserName: withdrawal.user.name,
          reason: adminNotes,
        },
      }, request);

      return NextResponse.json({
        withdrawal: result,
        message: 'Withdrawal rejected and balance refunded',
      });
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}