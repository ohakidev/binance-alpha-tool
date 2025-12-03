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
  estimatedValue?: number;
  airdropAmount?: string;
  requirements?: string[];
  requiredPoints?: number;
  deductPoints?: number;
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
        toast.success("แจ้งเตือนถูกส่งไปยัง Telegram แล้ว!", {
          description: "ตรวจสอบข้อความใน Telegram channel ของคุณ",
          duration: 5000,
        });
        return true;
      } else {
        toast.error("ไม่สามารถส่งแจ้งเตือนได้", {
          description: result.error || "เกิดข้อผิดพลาดในการส่งข้อความ",
        });
        return false;
      }
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
        toast.success("Telegram เชื่อมต่อแล้ว!", {
          description: `Channel: ${result.chatId} | Language: ${result.language}`,
        });
        return true;
      } else {
        toast.warning("Telegram ยังไม่ได้ตั้งค่า", {
          description: "กรุณาตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID",
        });
        return false;
      }
    } catch {
      toast.error("ไม่สามารถตรวจสอบการเชื่อมต่อได้");
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
