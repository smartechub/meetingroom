import {
  users,
  rooms,
  bookings,
  auditLogs,
  emailSettings,
  passwordResetTokens,
  calendarSync,
  type User,
  type UpsertUser,
  type Room,
  type InsertRoom,
  type Booking,
  type InsertBooking,
  type BookingWithRelations,
  type AuditLog,
  type InsertAuditLog,
  type EmailSettings,
  type InsertEmailSettings,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type CalendarSync,
  type InsertCalendarSync,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Room operations
  getAllRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  
  // Booking operations
  getAllBookings(): Promise<BookingWithRelations[]>;
  getBooking(id: number): Promise<BookingWithRelations | undefined>;
  getUserBookings(userId: string): Promise<BookingWithRelations[]>;
  getRoomBookings(roomId: number, startDate?: Date, endDate?: Date): Promise<BookingWithRelations[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  checkBookingConflict(roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalRooms: number;
    availableRooms: number;
    bookedToday: number;
    weeklyBookings: number;
  }>;
  
  // Email settings operations
  getEmailSettings(): Promise<EmailSettings | undefined>;
  upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Calendar sync operations
  getCalendarSync(userId: string): Promise<CalendarSync[]>;
  createCalendarSync(sync: InsertCalendarSync): Promise<CalendarSync>;
  updateCalendarSync(id: number, updates: Partial<CalendarSync>): Promise<CalendarSync | undefined>;
  deleteCalendarSync(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Room operations
  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(asc(rooms.name));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }

  async deleteRoom(id: number): Promise<boolean> {
    const [room] = await db
      .update(rooms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return !!room;
  }

  // Booking operations
  async getAllBookings(): Promise<BookingWithRelations[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.startDateTime));
    
    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async getBooking(id: number): Promise<BookingWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.bookings,
      room: result.rooms!,
      user: result.users!,
    };
  }

  async getUserBookings(userId: string): Promise<BookingWithRelations[]> {
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startDateTime));
    
    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async getRoomBookings(roomId: number, startDate?: Date, endDate?: Date): Promise<BookingWithRelations[]> {
    let whereCondition = eq(bookings.roomId, roomId);
    
    if (startDate && endDate) {
      whereCondition = and(
        eq(bookings.roomId, roomId),
        gte(bookings.startDateTime, startDate),
        lte(bookings.endDateTime, endDate)
      );
    }
    
    const result = await db
      .select()
      .from(bookings)
      .leftJoin(rooms, eq(bookings.roomId, rooms.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(whereCondition)
      .orderBy(asc(bookings.startDateTime));
    
    return result.map(row => ({
      ...row.bookings,
      room: row.rooms!,
      user: row.users!,
    }));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return (result.rowCount || 0) > 0;
  }

  async checkBookingConflict(roomId: number, startTime: Date, endTime: Date, excludeBookingId?: number): Promise<boolean> {
    let whereCondition = and(
      eq(bookings.roomId, roomId),
      eq(bookings.status, "confirmed"),
      or(
        and(
          gte(bookings.startDateTime, startTime),
          lte(bookings.startDateTime, endTime)
        ),
        and(
          gte(bookings.endDateTime, startTime),
          lte(bookings.endDateTime, endTime)
        ),
        and(
          lte(bookings.startDateTime, startTime),
          gte(bookings.endDateTime, endTime)
        )
      )
    );
    
    if (excludeBookingId) {
      whereCondition = and(
        whereCondition,
        eq(bookings.id, excludeBookingId)
      );
    }
    
    const conflicts = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(whereCondition);
    
    return conflicts.length > 0;
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalRooms: number;
    availableRooms: number;
    bookedToday: number;
    weeklyBookings: number;
  }> {
    const totalRooms = await db.select().from(rooms).where(eq(rooms.isActive, true));
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const bookedToday = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startDateTime, todayStart),
          lte(bookings.startDateTime, todayEnd)
        )
      );
    
    const weeklyBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startDateTime, weekStart)
        )
      );
    
    // Get currently occupied rooms
    const now = new Date();
    const currentlyBooked = await db
      .select({ roomId: bookings.roomId })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          lte(bookings.startDateTime, now),
          gte(bookings.endDateTime, now)
        )
      );
    
    const availableRooms = totalRooms.length - currentlyBooked.length;
    
    return {
      totalRooms: totalRooms.length,
      availableRooms: Math.max(0, availableRooms),
      bookedToday: bookedToday.length,
      weeklyBookings: weeklyBookings.length,
    };
  }

  // Email settings operations
  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings;
  }

  async upsertEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const [result] = await db
      .insert(emailSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: emailSettings.id,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [result] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return result;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    return result;
  }

  async deletePasswordResetToken(token: string): Promise<boolean> {
    const result = await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return (result.rowCount || 0) > 0;
  }

  // Calendar sync operations
  async getCalendarSync(userId: string): Promise<CalendarSync[]> {
    return await db
      .select()
      .from(calendarSync)
      .where(eq(calendarSync.userId, userId))
      .orderBy(asc(calendarSync.createdAt));
  }

  async createCalendarSync(sync: InsertCalendarSync): Promise<CalendarSync> {
    const [result] = await db
      .insert(calendarSync)
      .values(sync)
      .returning();
    return result;
  }

  async updateCalendarSync(id: number, updates: Partial<CalendarSync>): Promise<CalendarSync | undefined> {
    const [result] = await db
      .update(calendarSync)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarSync.id, id))
      .returning();
    return result;
  }

  async deleteCalendarSync(id: number): Promise<boolean> {
    const result = await db
      .delete(calendarSync)
      .where(eq(calendarSync.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
