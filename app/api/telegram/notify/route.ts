import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/services/telegram';

/**
 * POST /api/telegram/notify
 * Send Telegram notifications for airdrops
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'airdrop':
        success = await telegramService.sendAirdropAlert(data);
        break;
      case 'snapshot':
        success = await telegramService.sendSnapshotAlert(data);
        break;
      case 'claimable':
        success = await telegramService.sendClaimableAlert(data);
        break;
      case 'stability':
        success = await telegramService.sendStabilityWarning(data.symbol, data);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Telegram notification sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send Telegram notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/notify
 * Test endpoint to check if Telegram is configured
 */
export async function GET() {
  const isConfigured = !!(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );

  return NextResponse.json({
    configured: isConfigured,
    chatId: process.env.TELEGRAM_CHAT_ID
      ? `@${process.env.TELEGRAM_CHAT_ID}`
      : null,
    language: process.env.TELEGRAM_LANGUAGE || 'th',
  });
}
