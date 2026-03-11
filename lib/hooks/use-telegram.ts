import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/stores/language-store";

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
  const { t } = useLanguage();

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
        toast.success(t("common.telegramSent"), {
          description: t("common.telegramSentDescription"),
          duration: 5000,
        });
        return true;
      }

      toast.error(t("common.telegramSendFailed"), {
        description: result.error || t("common.telegramSendFailedDescription"),
      });
      return false;
    } catch {
      console.error("Telegram notification error");
      toast.error(t("common.error"), {
        description: t("common.telegramConnectionUnavailable"),
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
        toast.success(t("common.telegramConnected"), {
          description: `${t("common.channel")}: ${result.chatId} | ${t("settings.language")}: ${result.language}`,
        });
        return true;
      }

      toast.warning(t("common.telegramNotConfigured"), {
        description: t("common.telegramNotConfiguredDescription"),
      });
      return false;
    } catch {
      toast.error(t("common.telegramConnectionCheckFailed"));
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
