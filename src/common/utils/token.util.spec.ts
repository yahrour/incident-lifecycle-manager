import { generateSecureToken, hashToken } from "./token.util";

describe("token.util", () => {
  describe("hashToken", () => {
    it("produces the same hash for the same input", () => {
      const token = "abc123";
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it("produces different hashes for different inputs", () => {
      expect(hashToken("abc123")).not.toBe(hashToken("xyz789"));
    });
  });

  describe("generateSecureToken", () => {
    it("returns a rawToken and its matching hashedToken", () => {
      const { rawToken, hashedToken } = generateSecureToken();
      expect(hashToken(rawToken)).toBe(hashedToken);
    });

    it("generates different raw tokens on each call", () => {
      const first = generateSecureToken();
      const second = generateSecureToken();
      expect(first.rawToken).not.toBe(second.rawToken);
    });
  });
});
