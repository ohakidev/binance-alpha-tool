import { useState } from "react";
import { toast } from "sonner";

type NotificationType = "airdrop" | "snapshot" | "claimable" | "stability";

interface AirdropAlertData {
  name: string;
  symbol: string;
  chain: string;
  status: string;
  claimStartDate?: Date;
  claimEndDate?: Date;
  estimatedPrice?: number;
  estimatedValue?: number;
  airdropAmount?: string;
  requirements?: string[];
  requiredPoints?: number;
  pointsText?: string;
  deductPoints?: number;
  slotText?: string;
  contractAddress?: string;
}

interface TelegramNotification {
  type: NotificationType;
  data: AirdropAlertData | Record<string, unknown>;
}

interface TelegramNotifyResponse {
  success: boolean;
  error?: string;
}

interface TelegramStatusResponse {
  configured: boolean;
  chatId?: string;
  language?: string;
}

export function useTelegram() {
  const [isLoading, setIsLoading] = useState(false);

  const sendNotification = async ({
    type,
    data,
  }: TelegramNotification): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/telegram/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, data }),
      });

      const result: TelegramNotifyResponse = await response.json();

      if (result.success) {
        toast.success("ส่งแจ้งเตือนไปยัง Telegram แล้ว", {
          description: "ตรวจสอบข้อความล่าสุดใน Telegram channel ของคุณได้เลย",
          duration: 5000,
        });
        return true;
      }

      toast.error("ส่งแจ้งเตือนไม่สำเร็จ", {
        description: result.error || "เกิดข้อผิดพลาดระหว่างส่งข้อความไป Telegram",
      });
      return false;
    } catch {
      console.error("Telegram notification error");
      toast.error("เกิดข้อผิดพลาด", {
        description: "ไม่สามารถเชื่อมต่อกับ Telegram ได้",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendAirdropAlert = async (
    airdrop: AirdropAlertData,
  ): Promise<boolean> => {
    return sendNotification({
      type: "airdrop",
      data: airdrop,
    });
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/telegram/notify");
      const result: TelegramStatusResponse = await response.json();

      if (result.configured) {
        toast.success("เชื่อมต่อ Telegram แล้ว", {
          description: `Channel: ${result.chatId} | Language: ${result.language}`,
        });
        return true;
      }

      toast.warning("Telegram ยังไม่ได้ตั้งค่า", {
        description: "กรุณาตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID",
      });
      return false;
    } catch {
      toast.error("ไม่สามารถตรวจสอบการเชื่อมต่อ Telegram ได้");
      return false;
    }
  };

  return {
    isLoading,
    sendNotification,
    sendAirdropAlert,
    testConnection,
  };
}
