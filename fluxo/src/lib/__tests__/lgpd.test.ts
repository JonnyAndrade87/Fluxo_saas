import { describe, it, expect, vi, beforeEach } from "vitest";
import { anonymizeCustomer, cleanOldCommunicationLogs } from "../lgpd";
import { prisma } from "../prisma";

// Mock do Prisma para testes eficientes sem tocar no banco real
vi.mock("../prisma", () => ({
  prisma: {
    customer: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    financialContact: {
      deleteMany: vi.fn(),
    },
    customerNote: {
      deleteMany: vi.fn(),
    },
    communication: {
      updateMany: vi.fn(),
    },
    communicationLog: {
      updateMany: vi.fn(),
    },
  },
}));

describe("LGPD Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("anonymizeCustomer", () => {
    it("deve retornar falso se o cliente não pertencer ao tenant ou não existir", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const result = await anonymizeCustomer("tenant_123", "cust_456");

      expect(result).toBe(false);
      expect(prisma.customer.update).not.toHaveBeenCalled();
    });

    it("deve anonimizar o cliente e apagar dados relacionados caso exista", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: "cust_456" } as any);
      vi.mocked(prisma.customer.update).mockResolvedValue({} as any);

      const result = await anonymizeCustomer("tenant_123", "cust_456");

      expect(result).toBe(true);
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cust_456" },
          data: expect.objectContaining({
            email: expect.stringContaining("@anon.local"),
            phone: null,
            address: null,
          }),
        })
      );
      expect(prisma.financialContact.deleteMany).toHaveBeenCalledWith({
        where: { customerId: "cust_456", tenantId: "tenant_123" },
      });
      expect(prisma.customerNote.deleteMany).toHaveBeenCalledWith({
        where: { customerId: "cust_456", tenantId: "tenant_123" },
      });
    });
  });

  describe("cleanOldCommunicationLogs", () => {
    it("deve mascarar os conteúdos sensíveis e retornar a soma de registros limpos", async () => {
      vi.mocked(prisma.communication.updateMany).mockResolvedValue({ count: 5 } as any);
      vi.mocked(prisma.communicationLog.updateMany).mockResolvedValue({ count: 3 } as any);

      const count = await cleanOldCommunicationLogs("tenant_123", 90);

      expect(count).toBe(8);
      expect(prisma.communication.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: "tenant_123" }),
          data: { content: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]" },
        })
      );
      expect(prisma.communicationLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { message: "[CONTEÚDO APAGADO POR POLÍTICA DE RETENÇÃO - LGPD]" },
        })
      );
    });
  });
});
