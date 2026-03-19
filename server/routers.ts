import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Helper function to generate a unique group code
function generateGroupCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "KITA-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ GROUP ROUTES ============
  groups: router({
    // Create a new group
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "Group name required").max(255),
          description: z.string().max(1000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const code = generateGroupCode();
        const groupId = await db.createGroup({
          name: input.name,
          description: input.description,
          ownerId: ctx.user.id,
          code,
        });

        // Add creator as first member
        await db.addGroupMember({
          groupId,
          userId: ctx.user.id,
        });

        return { id: groupId, code };
      }),

    // List user's groups
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserGroups(ctx.user.id);
    }),

    // Get group details
    getById: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Check if user is in group
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        return db.getGroupById(input.groupId);
      }),

    // Join group by code
    joinByCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getGroupByCode(input.code);
        if (!group) {
          throw new Error("Group not found");
        }

        // Check if already a member
        const isMember = await db.isUserInGroup(group.id, ctx.user.id);
        if (isMember) {
          throw new Error("Already a member of this group");
        }

        // Add user to group
        await db.addGroupMember({
          groupId: group.id,
          userId: ctx.user.id,
        });

        return group;
      }),

    // Leave group
    leave: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        await db.removeGroupMember(input.groupId, ctx.user.id);
        return { success: true };
      }),

    // Delete group (owner only)
    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getGroupById(input.groupId);
        if (!group) {
          throw new Error("Group not found");
        }

        if (group.ownerId !== ctx.user.id) {
          throw new Error("Only group owner can delete");
        }

        await db.deleteGroup(input.groupId);
        return { success: true };
      }),

    // Get group members
    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        return db.getGroupMembers(input.groupId);
      }),

    // Remove member from group (owner only)
    removeMember: protectedProcedure
      .input(z.object({ groupId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getGroupById(input.groupId);
        if (!group) {
          throw new Error("Group not found");
        }

        if (group.ownerId !== ctx.user.id) {
          throw new Error("Only group owner can remove members");
        }

        await db.removeGroupMember(input.groupId, input.userId);
        return { success: true };
      }),
  }),

  // ============ LOCATION ROUTES ============
  locations: router({
    // Update user's location
    update: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          latitude: z.number(),
          longitude: z.number(),
          accuracy: z.number().optional(),
          batteryLevel: z.number().min(0).max(100).optional(),
          isCharging: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user is in group
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        // Store location
        const locationId = await db.updateLocation({
          userId: ctx.user.id,
          groupId: input.groupId,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          accuracy: input.accuracy?.toString(),
          batteryLevel: input.batteryLevel,
          isCharging: input.isCharging,
        });

        // Update battery status if provided
        if (input.batteryLevel !== undefined) {
          await db.updateBatteryStatus({
            userId: ctx.user.id,
            batteryLevel: input.batteryLevel,
            isCharging: input.isCharging,
          });
        }

        return { id: locationId, success: true };
      }),

    // Get latest locations for all group members
    getGroupLocations: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        return db.getLatestGroupLocations(input.groupId);
      }),

    // Get specific user's latest location
    getUserLocation: protectedProcedure
      .input(z.object({ groupId: z.number(), userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        return db.getLatestUserLocation(input.userId, input.groupId);
      }),
  }),

  // ============ BATTERY STATUS ROUTES ============
  battery: router({
    // Get user's battery status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBatteryStatus(ctx.user.id);
    }),

    // Get battery status for all group members
    getGroupStatus: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const isMember = await db.isUserInGroup(input.groupId, ctx.user.id);
        if (!isMember) {
          throw new Error("Not a member of this group");
        }

        return db.getGroupBatteryStatus(input.groupId);
      }),

    // Update battery status
    update: protectedProcedure
      .input(
        z.object({
          batteryLevel: z.number().min(0).max(100),
          isCharging: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateBatteryStatus({
          userId: ctx.user.id,
          batteryLevel: input.batteryLevel,
          isCharging: input.isCharging,
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
