import { db } from './db';
import { ActivityAction } from '@prisma/client';
import { NextRequest } from 'next/server';

interface LogActivityParams {
  action: ActivityAction;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log user activity to the database
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const log = await db.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking main operations
    return null;
  }
}

/**
 * Get client info from request headers
 */
export function getClientInfo(request?: NextRequest): { ipAddress: string; userAgent: string } {
  let ipAddress = 'unknown';
  let userAgent = 'unknown';

  try {
    if (request) {
      // Get IP from various headers
      ipAddress = 
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown';
      
      userAgent = request.headers.get('user-agent') || 'unknown';
    }
  } catch (error) {
    console.error('Failed to get client info:', error);
  }

  return { ipAddress, userAgent };
}

/**
 * Helper function to log activity with request context
 */
export async function logActivityWithContext(
  params: Omit<LogActivityParams, 'ipAddress' | 'userAgent'>,
  request?: NextRequest
) {
  const { ipAddress, userAgent } = getClientInfo(request);
  return logActivity({
    ...params,
    ipAddress,
    userAgent,
  });
}

/**
 * Activity Logger class for easy logging in API routes
 */
export class ActivityLogger {
  // Authentication
  static async login(userId: string, request?: NextRequest) {
    return logActivityWithContext({ action: ActivityAction.LOGIN, userId }, request);
  }

  static async loginFailed(email: string, request?: NextRequest) {
    return logActivityWithContext({ action: ActivityAction.LOGIN_FAILED, details: { email } }, request);
  }

  static async logout(userId: string, request?: NextRequest) {
    return logActivityWithContext({ action: ActivityAction.LOGOUT, userId }, request);
  }

  // User Management
  static async userCreate(adminId: string, user: { id: string; name: string; email: string; role: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.USER_CREATE,
      userId: adminId,
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      details: { email: user.email, role: user.role },
    }, request);
  }

  static async userUpdate(adminId: string, user: { id: string; name: string; email: string }, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.USER_UPDATE,
      userId: adminId,
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      details: { email: user.email, changes },
    }, request);
  }

  static async userBan(adminId: string, user: { id: string; name: string; email: string }, reason?: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.USER_BAN,
      userId: adminId,
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      details: { email: user.email, reason },
    }, request);
  }

  static async userUnban(adminId: string, user: { id: string; name: string; email: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.USER_UNBAN,
      userId: adminId,
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      details: { email: user.email },
    }, request);
  }

  // Account Management
  static async accountCreate(userId: string, account: { id: string; publicId: string; gameName: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.ACCOUNT_CREATE,
      userId,
      entityType: 'Account',
      entityId: account.id,
      entityName: account.publicId,
      details: { game: account.gameName },
    }, request);
  }

  static async accountExtract(userId: string, account: { id: string; publicId: string; gameName: string }, price: number, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.ACCOUNT_EXTRACT,
      userId,
      entityType: 'Account',
      entityId: account.id,
      entityName: account.publicId,
      details: { game: account.gameName, price },
    }, request);
  }

  // Game Management
  static async gameCreate(adminId: string, game: { id: string; name: string; code: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.GAME_CREATE,
      userId: adminId,
      entityType: 'Game',
      entityId: game.id,
      entityName: game.name,
      details: { code: game.code },
    }, request);
  }

  static async gameUpdate(adminId: string, game: { id: string; name: string; code: string }, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.GAME_UPDATE,
      userId: adminId,
      entityType: 'Game',
      entityId: game.id,
      entityName: game.name,
      details: { code: game.code, changes },
    }, request);
  }

  // Character Management
  static async characterCreate(adminId: string, character: { id: string; name: string; gameName: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.CHARACTER_CREATE,
      userId: adminId,
      entityType: 'Character',
      entityId: character.id,
      entityName: character.name,
      details: { game: character.gameName },
    }, request);
  }

  // Tier Management
  static async tierCreate(adminId: string, tier: { id: string; name: string; discountPercent: number }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TIER_CREATE,
      userId: adminId,
      entityType: 'Tier',
      entityId: tier.id,
      entityName: tier.name,
      details: { discountPercent: tier.discountPercent },
    }, request);
  }

  static async tierUpdate(adminId: string, tier: { id: string; name: string }, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TIER_UPDATE,
      userId: adminId,
      entityType: 'Tier',
      entityId: tier.id,
      entityName: tier.name,
      details: { changes },
    }, request);
  }

  // Finance - Topup
  static async topupRequest(userId: string, topupId: string, amount: number, method: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TOPUP_REQUEST,
      userId,
      entityType: 'TopupRequest',
      entityId: topupId,
      details: { amount, paymentMethod: method },
    }, request);
  }

  static async topupApprove(adminId: string, topupId: string, amount: number, targetUserId: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TOPUP_APPROVE,
      userId: adminId,
      entityType: 'TopupRequest',
      entityId: topupId,
      details: { amount, targetUserId },
    }, request);
  }

  static async topupReject(adminId: string, topupId: string, amount: number, targetUserId: string, reason?: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TOPUP_REJECT,
      userId: adminId,
      entityType: 'TopupRequest',
      entityId: topupId,
      details: { amount, targetUserId, reason },
    }, request);
  }

  // Finance - Withdrawal
  static async withdrawRequest(userId: string, withdrawalId: string, amount: number, type: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.WITHDRAW_REQUEST,
      userId,
      entityType: 'WithdrawalRequest',
      entityId: withdrawalId,
      details: { amount, type },
    }, request);
  }

  static async withdrawApprove(adminId: string, withdrawalId: string, amount: number, targetUserId: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.WITHDRAW_APPROVE,
      userId: adminId,
      entityType: 'WithdrawalRequest',
      entityId: withdrawalId,
      details: { amount, targetUserId },
    }, request);
  }

  static async withdrawReject(adminId: string, withdrawalId: string, amount: number, targetUserId: string, reason?: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.WITHDRAW_REJECT,
      userId: adminId,
      entityType: 'WithdrawalRequest',
      entityId: withdrawalId,
      details: { amount, targetUserId, reason },
    }, request);
  }

  static async transferBalance(userId: string, amount: number, from: string, to: string, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TRANSFER_BALANCE,
      userId,
      details: { amount, from, to },
    }, request);
  }

  // Settings
  static async platformSettingsUpdate(adminId: string, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.PLATFORM_SETTINGS_UPDATE,
      userId: adminId,
      entityType: 'PlatformSettings',
      details: { changes },
    }, request);
  }

  // Profile
  static async passwordChange(userId: string, request?: NextRequest) {
    return logActivityWithContext({ action: ActivityAction.PASSWORD_CHANGE, userId }, request);
  }

  static async profileUpdate(userId: string, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.PROFILE_UPDATE,
      userId,
      details: { changes },
    }, request);
  }

  // Payment Method
  static async paymentMethodCreate(adminId: string, method: { id: string; name: string; type: string }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.PAYMENT_METHOD_CREATE,
      userId: adminId,
      entityType: 'PaymentMethod',
      entityId: method.id,
      entityName: method.name,
      details: { type: method.type },
    }, request);
  }

  static async paymentMethodUpdate(adminId: string, method: { id: string; name: string }, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.PAYMENT_METHOD_UPDATE,
      userId: adminId,
      entityType: 'PaymentMethod',
      entityId: method.id,
      entityName: method.name,
      details: { changes },
    }, request);
  }

  // Topup Package
  static async topupPackageCreate(adminId: string, pkg: { id: string; amount: number; bonus: number }, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TOPUP_PACKAGE_CREATE,
      userId: adminId,
      entityType: 'TopupPackage',
      entityId: pkg.id,
      entityName: `Rp ${pkg.amount.toLocaleString()}`,
      details: { amount: pkg.amount, bonus: pkg.bonus },
    }, request);
  }

  static async topupPackageUpdate(adminId: string, pkg: { id: string; amount: number }, changes: Record<string, any>, request?: NextRequest) {
    return logActivityWithContext({
      action: ActivityAction.TOPUP_PACKAGE_UPDATE,
      userId: adminId,
      entityType: 'TopupPackage',
      entityId: pkg.id,
      entityName: `Rp ${pkg.amount.toLocaleString()}`,
      details: { changes },
    }, request);
  }
}
