import { describe, it, expect } from "vitest";
import { ADSENSE_SLOT_IDS, type AdPosition } from "./AdSlot";

describe("Google AdSense Slot IDs Configuration", () => {
  const expectedSlots: Record<AdPosition, string> = {
    header: "2663115877",
    "in-article": "1723132398",
    sidebar: "9410050726",
    footer: "9886999771",
  };

  it("maps each ad position to its corresponding official Google AdSense slot ID", () => {
    expect(ADSENSE_SLOT_IDS).toEqual(expectedSlots);
  });

  it("contains valid 10-digit numeric slot IDs for all positions", () => {
    Object.values(ADSENSE_SLOT_IDS).forEach((slotId) => {
      expect(slotId).toMatch(/^\d{10}$/);
      expect(slotId).not.toBe("0000000000");
    });
  });
});
