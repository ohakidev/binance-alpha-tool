import { describe, it, expect } from "vitest";
import { airdropCalculator } from "@/lib/services/airdrop-calculator";

describe("AirdropCalculator", () => {
  describe("calculateAirdropScore", () => {
    it("should return 0-100 score", () => {
      const score = airdropCalculator.calculateAirdropScore({
        estimatedValue: 500,
        participantCount: 10000,
        verified: true,
        requirements: ["Hold BNB", "Trade"],
        claimEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should give higher score for verified airdrops", () => {
      const verifiedScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 500,
        participantCount: 10000,
        verified: true,
        requirements: [],
        claimEndDate: null,
      });

      const unverifiedScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 500,
        participantCount: 10000,
        verified: false,
        requirements: [],
        claimEndDate: null,
      });

      expect(verifiedScore).toBeGreaterThan(unverifiedScore);
    });

    it("should give higher score for higher value airdrops", () => {
      const highValueScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 1000,
        participantCount: 10000,
        verified: true,
        requirements: [],
        claimEndDate: null,
      });

      const lowValueScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 100,
        participantCount: 10000,
        verified: true,
        requirements: [],
        claimEndDate: null,
      });

      expect(highValueScore).toBeGreaterThan(lowValueScore);
    });

    it("should give urgency bonus for ending soon", () => {
      const endingSoonScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 500,
        participantCount: 10000,
        verified: true,
        requirements: [],
        claimEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });

      const laterScore = airdropCalculator.calculateAirdropScore({
        estimatedValue: 500,
        participantCount: 10000,
        verified: true,
        requirements: [],
        claimEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      });

      expect(endingSoonScore).toBeGreaterThan(laterScore);
    });
  });
});
