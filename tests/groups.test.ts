import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

// Mock user context
function createMockContext(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: `Test User ${userId}`,
      email: `user${userId}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("groups", () => {
  it("creates a new group", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.groups.create({
      name: "Test Group",
      description: "A test group",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.code).toMatch(/^KITA-[A-Z0-9]{6}$/);
  });



  it("joins a group by code", async () => {
    const ctx1 = createMockContext(1);
    const ctx2 = createMockContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a group
    const created = await caller1.groups.create({
      name: "Test Group",
    });

    // User 2 joins by code
    const joined = await caller2.groups.joinByCode({
      code: created.code,
    });

    expect(joined.id).toBe(created.id);
  });

  it("prevents duplicate membership", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create a group
    const created = await caller.groups.create({
      name: "Test Group",
    });

    // Try to join the same group again
    try {
      await caller.groups.joinByCode({
        code: created.code,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Already a member");
    }
  });



  it("leaves a group", async () => {
    const ctx1 = createMockContext(1);
    const ctx2 = createMockContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a group
    const created = await caller1.groups.create({
      name: "Test Group",
    });

    // User 2 joins
    await caller2.groups.joinByCode({
      code: created.code,
    });

    // User 2 leaves
    const result = await caller2.groups.leave({
      groupId: created.id,
    });

    expect(result.success).toBe(true);
  });
});

describe("locations", () => {
  it("updates user location", async () => {
    const ctx1 = createMockContext(1);
    const ctx2 = createMockContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Create group
    const group = await caller1.groups.create({
      name: "Test Group",
    });

    // User 2 joins
    await caller2.groups.joinByCode({
      code: group.code,
    });

    // Update location
    const result = await caller1.locations.update({
      groupId: group.id,
      latitude: 14.5995,
      longitude: 120.9842,
      accuracy: 10,
      batteryLevel: 85,
      isCharging: false,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("gets user location", async () => {
    const ctx1 = createMockContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // Create group
    const group = await caller1.groups.create({
      name: "Test Group",
    });

    // Update location
    await caller1.locations.update({
      groupId: group.id,
      latitude: 14.5995,
      longitude: 120.9842,
      batteryLevel: 85,
    });

    // Get user's location
    const location = await caller1.locations.getUserLocation({
      groupId: group.id,
      userId: 1,
    });

    expect(location).toBeDefined();
    if (location) {
      expect(location.userId).toBe(1);
      expect(location.groupId).toBe(group.id);
    }
  });
});

describe("battery", () => {
  it("updates battery status", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.battery.update({
      batteryLevel: 75,
      isCharging: false,
    });

    expect(result.success).toBe(true);
  });

  it("gets user battery status", async () => {
    const ctx = createMockContext(1);
    const caller = appRouter.createCaller(ctx);

    // Update battery
    await caller.battery.update({
      batteryLevel: 75,
      isCharging: false,
    });

    // Get battery status
    const status = await caller.battery.getStatus();

    expect(status).toBeDefined();
    expect(status?.batteryLevel).toBe(75);
    expect(status?.isCharging).toBe(false);
  });
});
