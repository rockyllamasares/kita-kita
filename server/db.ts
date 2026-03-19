import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  groups,
  groupMembers,
  locations,
  batteryStatus,
  InsertGroup,
  InsertGroupMember,
  InsertLocation,
  InsertBatteryStatus,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ GROUP QUERIES ============

export async function createGroup(data: InsertGroup): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values(data);
  // MySQL2 returns insertId in different places depending on version
  const insertId = (result as any).insertId || (result as any)[0]?.insertId;
  if (!insertId) throw new Error("Failed to get insert ID");
  return Number(insertId);
}

export async function getGroupByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGroupById(groupId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ group: groups })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  return result.map((r) => r.group);
}

export async function deleteGroup(groupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(groups).where(eq(groups.id, groupId));
}

// ============ GROUP MEMBER QUERIES ============

export async function addGroupMember(data: InsertGroupMember): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate groupId and userId
  if (!Number.isFinite(data.groupId) || !Number.isFinite(data.userId)) {
    throw new Error("Invalid groupId or userId");
  }

  const values = {
    groupId: data.groupId,
    userId: data.userId,
  };

  const result = await db.insert(groupMembers).values(values);
  const insertId = (result as any).insertId || (result as any)[0]?.insertId;
  if (!insertId) throw new Error("Failed to get insert ID");
  return Number(insertId);
}

export async function removeGroupMember(groupId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ user: users, member: groupMembers })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));

  return result.map((r) => ({ ...r.user, joinedAt: r.member.joinedAt }));
}

export async function isUserInGroup(groupId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  return result.length > 0;
}

// ============ LOCATION QUERIES ============

export async function updateLocation(data: InsertLocation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(locations).values(data);
  const insertId = (result as any).insertId || (result as any)[0]?.insertId;
  if (!insertId) throw new Error("Failed to get insert ID");
  return Number(insertId);
}

export async function getLatestGroupLocations(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all locations for the group, ordered by timestamp
  const result = await db
    .select({ location: locations, user: users })
    .from(locations)
    .innerJoin(users, eq(locations.userId, users.id))
    .where(eq(locations.groupId, groupId))
    .orderBy(desc(locations.timestamp));

  // Group by userId and take the first (latest) for each
  const latestByUser = new Map();
  result.forEach((r) => {
    if (!latestByUser.has(r.location.userId)) {
      latestByUser.set(r.location.userId, { ...r.location, userName: r.user.name });
    }
  });

  return Array.from(latestByUser.values());
}

export async function getLatestUserLocation(userId: number, groupId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(locations)
    .where(and(eq(locations.userId, userId), eq(locations.groupId, groupId)))
    .orderBy(desc(locations.timestamp))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ BATTERY STATUS QUERIES ============

export async function updateBatteryStatus(data: InsertBatteryStatus): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(batteryStatus)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        batteryLevel: data.batteryLevel,
        isCharging: data.isCharging,
        lastUpdated: new Date(),
      },
    });
}

export async function getUserBatteryStatus(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(batteryStatus)
    .where(eq(batteryStatus.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getGroupBatteryStatus(groupId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ battery: batteryStatus, user: users })
    .from(batteryStatus)
    .innerJoin(users, eq(batteryStatus.userId, users.id))
    .innerJoin(groupMembers, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));

  return result.map((r) => ({ ...r.battery, userName: r.user.name }));
}
