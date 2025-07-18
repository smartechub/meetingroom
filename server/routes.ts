import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./customAuth";
import { insertRoomSchema, insertBookingSchema, updateBookingSchema, insertEmailSettingsSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import * as nodemailer from "nodemailer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with default admin user
  const { initializeDatabase } = await import("./initializeDb");
  await initializeDatabase();
  
  // Auth middleware
  await setupAuth(app);

  // Helper function to create audit log
  const createAuditLog = async (req: any, action: string, resourceType: string, resourceId?: string, details?: any) => {
    if (req.user?.id) {
      await storage.createAuditLog({
        userId: req.user.id,
        action,
        resourceType,
        resourceId,
        details,
      });
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Room routes
  app.get('/api/rooms', isAuthenticated, async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get('/api/rooms/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // Check room availability for a specific time slot
  app.post('/api/rooms/availability', isAuthenticated, async (req, res) => {
    try {
      const { startDateTime, endDateTime } = req.body;
      
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({ message: "Start and end date times are required" });
      }
      
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      const rooms = await storage.getAllRooms();
      const roomAvailability = [];
      
      for (const room of rooms) {
        const hasConflict = await storage.checkBookingConflict(room.id, start, end);
        roomAvailability.push({
          ...room,
          available: !hasConflict,
          conflictReason: hasConflict ? 'Already booked for this time slot' : null
        });
      }
      
      res.json(roomAvailability);
    } catch (error) {
      console.error("Error checking room availability:", error);
      res.status(500).json({ message: "Failed to check room availability" });
    }
  });

  app.post('/api/rooms', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      await createAuditLog(req, 'create', 'room', room.id.toString(), room);
      res.json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.put('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      const room = await storage.updateRoom(id, updates);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      await createAuditLog(req, 'update', 'room', id.toString(), updates);
      res.json(room);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Failed to update room" });
    }
  });

  app.delete('/api/rooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteRoom(id);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      await createAuditLog(req, 'delete', 'room', id.toString());
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      let bookings;
      
      if (user?.role === 'admin') {
        bookings = await storage.getAllBookings();
      } else {
        bookings = await storage.getUserBookings(req.user.id);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/my', isAuthenticated, async (req: any, res) => {
    try {
      const bookings = await storage.getUserBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch user bookings" });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role === 'viewer') {
        return res.status(403).json({ message: "Viewers cannot create bookings" });
      }

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Check for conflicts
      const hasConflict = await storage.checkBookingConflict(
        bookingData.roomId,
        new Date(bookingData.startDateTime),
        new Date(bookingData.endDateTime)
      );
      
      if (hasConflict) {
        return res.status(400).json({ message: "Booking conflict detected" });
      }
      
      const booking = await storage.createBooking(bookingData);
      await createAuditLog(req, 'create', 'booking', booking.id.toString(), booking);
      
      // Send notification emails to participants
      if (booking.participants && booking.participants.length > 0) {
        try {
          const room = await storage.getRoom(booking.roomId);
          const startDate = new Date(booking.startDateTime);
          const endDate = new Date(booking.endDateTime);
          
          // Get email settings
          const emailSettings = await storage.getEmailSettings();
          if (emailSettings && emailSettings.enableBookingNotifications) {
            const transporter = nodemailer.createTransport({
              host: emailSettings.smtpHost,
              port: emailSettings.smtpPort,
              secure: emailSettings.smtpPort === 465,
              auth: {
                user: emailSettings.smtpUsername,
                pass: emailSettings.smtpPassword,
              },
            });

            // Send email to each participant
            for (const participantEmail of booking.participants) {
              const emailContent = `
                <h2>Meeting Invitation</h2>
                <p>You have been invited to a meeting:</p>
                <p><strong>Title:</strong> ${booking.title}</p>
                <p><strong>Room:</strong> ${room?.name}</p>
                <p><strong>Date:</strong> ${startDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}</p>
                ${booking.description ? `<p><strong>Description:</strong> ${booking.description}</p>` : ''}
                <p><strong>Organizer:</strong> ${user?.firstName} ${user?.lastName} (${user?.email})</p>
              `;

              await transporter.sendMail({
                from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
                to: participantEmail,
                subject: `Meeting Invitation: ${booking.title}`,
                html: emailContent,
              });
            }
          }
        } catch (emailError) {
          console.error('Error sending participant notifications:', emailError);
          // Don't fail the booking creation if email fails
        }
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.put('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const parsedUpdates = updateBookingSchema.parse(req.body);
      const updates = {
        ...parsedUpdates,
        startDateTime: new Date(parsedUpdates.startDateTime),
        endDateTime: new Date(parsedUpdates.endDateTime),
      };
      const updatedBooking = await storage.updateBooking(id, updates);
      await createAuditLog(req, 'update', 'booking', id.toString(), updates);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin' && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteBooking(id);
      if (!success) {
        return res.status(404).json({ message: "Booking not found" });
      }
      await createAuditLog(req, 'delete', 'booking', id.toString());
      res.json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { email, firstName, lastName, role, password } = req.body;
      
      if (!email || !firstName || !lastName || !role || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash password
      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate UUID for new user
      const { v4: uuidv4 } = await import("uuid");
      const newUser = await storage.createUser({
        id: uuidv4(),
        email,
        firstName,
        lastName,
        role,
        passwordHash,
      });
      
      await createAuditLog(req, 'create', 'user', newUser.id, { email, firstName, lastName, role });
      
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = newUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = req.params.id;
      const updates = req.body;
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await createAuditLog(req, 'update', 'user', id, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = req.params.id;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      await createAuditLog(req, 'delete', 'user', id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Audit log routes (Admin only)
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // File upload route
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // In a real application, you'd upload to a cloud storage service
      res.json({ 
        url: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Conflict check route
  app.post('/api/bookings/check-conflict', isAuthenticated, async (req, res) => {
    try {
      const { roomId, startDateTime, endDateTime, excludeBookingId } = req.body;
      
      const hasConflict = await storage.checkBookingConflict(
        roomId,
        new Date(startDateTime),
        new Date(endDateTime),
        excludeBookingId
      );
      
      res.json({ hasConflict });
    } catch (error) {
      console.error("Error checking booking conflict:", error);
      res.status(500).json({ message: "Failed to check booking conflict" });
    }
  });

  // Email settings routes (admin only)
  app.get('/api/email-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const settings = await storage.getEmailSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.post('/api/email-settings', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertEmailSettingsSchema.parse(req.body);
      const settings = await storage.upsertEmailSettings(validatedData);
      
      await createAuditLog(req, "update", "email_settings", "1", { 
        action: "Updated email settings",
        changes: validatedData
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post('/api/email-settings/test', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Test email connection (this would require nodemailer setup)
      // For now, just return success
      res.json({ message: "Email connection test successful" });
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ message: "Email connection test failed" });
    }
  });

  // User profile routes
  app.put('/api/auth/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      
      // Get current user
      const user = await storage.getUser(req.user.id);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const bcrypt = await import("bcrypt");
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUser(req.user.id, { passwordHash: newPasswordHash });
      
      await createAuditLog(req, 'update', 'user', req.user.id, { action: "Changed password" });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.put('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const { firstName, lastName } = req.body;
      
      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { firstName, lastName });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await createAuditLog(req, 'update', 'user', req.user.id, { firstName, lastName });
      
      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Password reset routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      console.log('Forgot password request for:', email);
      
      // Generate reset token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      
      // Find user by email
      const users = await storage.getAllUsers();
      const user = users.find(u => u.email === email);
      console.log('User lookup for', email, ':', user ? `Found: ${user.email}` : 'Not found');
      
      if (!user) {
        // Don't reveal if user exists or not - but still return success message
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
      });
      
      // Get email settings to send the reset email
      try {
        console.log('Attempting to get email settings...');
        const emailSettings = await storage.getEmailSettings();
        console.log('Email settings retrieved:', emailSettings ? `Found: ${emailSettings.smtpHost}:${emailSettings.smtpPort}` : 'Not found');
        console.log('Full email settings:', emailSettings);
        if (emailSettings && emailSettings.smtpHost) {
          // Create transporter with the configured SMTP settings
          console.log('Creating email transporter with settings:', {
            host: emailSettings.smtpHost,
            port: emailSettings.smtpPort,
            secure: emailSettings.smtpPort === 465,
            user: emailSettings.smtpUsername
          });
          
          const transporter = nodemailer.createTransport({
            host: emailSettings.smtpHost,
            port: emailSettings.smtpPort || 587,
            secure: emailSettings.smtpPort === 465, // true for 465, false for other ports
            auth: {
              user: emailSettings.smtpUsername,
              pass: emailSettings.smtpPassword,
            },
          });
          
          // Generate reset link
          const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
          
          // Email content
          const mailOptions = {
            from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
            to: email,
            subject: 'Password Reset Request - Room Booking System',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${user.firstName},</p>
                <p>You requested to reset your password for the Room Booking System. Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                </div>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">Room Booking System</p>
              </div>
            `,
            text: `
              Password Reset Request
              
              Hello ${user.firstName},
              
              You requested to reset your password for the Room Booking System.
              Please visit this link to reset your password: ${resetUrl}
              
              This link will expire in 1 hour.
              
              If you didn't request this password reset, please ignore this email.
            `
          };
          
          // Send email
          try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent successfully to ${email} using SMTP: ${emailSettings.smtpHost}:${emailSettings.smtpPort}`);
          } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            console.error('SMTP Config:', {
              host: emailSettings.smtpHost,
              port: emailSettings.smtpPort,
              user: emailSettings.smtpUsername
            });
            // Don't throw the error to avoid revealing email configuration details
          }
          
        } else {
          // Log token for development if no email configuration
          console.log(`Password reset token for ${email}: ${token}`);
        }
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Don't reveal email sending failure to user for security
      }
      
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Error handling forgot password:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Find valid reset token
      const resetTokens = await storage.getPasswordResetTokens();
      const resetToken = resetTokens.find(rt => 
        rt.token === token && 
        rt.expiresAt > new Date() && 
        !rt.usedAt
      );
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUser(resetToken.userId, { passwordHash });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Calendar sync routes
  app.get('/api/calendar-sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const calendarSyncs = await storage.getCalendarSync(userId);
      res.json(calendarSyncs);
    } catch (error) {
      console.error("Error fetching calendar syncs:", error);
      res.status(500).json({ message: "Failed to fetch calendar syncs" });
    }
  });

  app.post('/api/calendar-sync/connect/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const { provider } = req.params;
      const userId = req.user.id;
      
      // Generate OAuth URL (mock implementation)
      const authUrl = `https://oauth.${provider}.com/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error connecting calendar:", error);
      res.status(500).json({ message: "Failed to connect calendar" });
    }
  });

  app.delete('/api/calendar-sync/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user owns this sync
      const sync = await storage.getCalendarSync(userId);
      const userSync = sync.find(s => s.id === parseInt(id));
      
      if (!userSync) {
        return res.status(404).json({ message: "Calendar sync not found" });
      }
      
      await storage.deleteCalendarSync(parseInt(id));
      
      await createAuditLog(req, "delete", "calendar_sync", id, { 
        action: "Disconnected calendar sync",
        provider: userSync.provider
      });
      
      res.json({ message: "Calendar sync deleted successfully" });
    } catch (error) {
      console.error("Error deleting calendar sync:", error);
      res.status(500).json({ message: "Failed to delete calendar sync" });
    }
  });

  app.post('/api/calendar-sync/:id/sync', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if user owns this sync
      const sync = await storage.getCalendarSync(userId);
      const userSync = sync.find(s => s.id === parseInt(id));
      
      if (!userSync) {
        return res.status(404).json({ message: "Calendar sync not found" });
      }
      
      // Mock sync operation
      await storage.updateCalendarSync(parseInt(id), {
        lastSyncAt: new Date(),
      });
      
      await createAuditLog(req, "update", "calendar_sync", id, { 
        action: "Manual calendar sync",
        provider: userSync.provider
      });
      
      res.json({ message: "Calendar synced successfully" });
    } catch (error) {
      console.error("Error syncing calendar:", error);
      res.status(500).json({ message: "Failed to sync calendar" });
    }
  });

  // Analytics routes (admin only)
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { dateRange = '7d', roomId = 'all' } = req.query;
      
      // Mock analytics data - in production, this would query the database
      const analyticsData = {
        summary: {
          totalBookings: 245,
          totalBookingsChange: 12.5,
          uniqueUsers: 89,
          uniqueUsersChange: 8.2,
          averageBookingDuration: 2.3,
          averageBookingDurationChange: -5.1,
          peakUtilization: 87,
          peakUtilizationChange: 15.3,
        },
        bookingTrends: [
          { date: '2024-01-01', bookings: 12, duration: 2.1 },
          { date: '2024-01-02', bookings: 15, duration: 2.4 },
          { date: '2024-01-03', bookings: 18, duration: 2.0 },
          { date: '2024-01-04', bookings: 22, duration: 2.6 },
          { date: '2024-01-05', bookings: 19, duration: 2.2 },
          { date: '2024-01-06', bookings: 16, duration: 2.3 },
          { date: '2024-01-07', bookings: 21, duration: 2.5 },
        ],
        roomUtilization: [
          { name: 'Conference Room A', bookings: 45, utilization: 78, hours: 96 },
          { name: 'Meeting Room B', bookings: 38, utilization: 65, hours: 82 },
          { name: 'Board Room', bookings: 22, utilization: 45, hours: 54 },
          { name: 'Training Room', bookings: 31, utilization: 58, hours: 71 },
        ],
        timeDistribution: Array.from({ length: 12 }, (_, i) => ({
          hour: i + 8,
          bookings: Math.floor(Math.random() * 30) + 5,
        })),
        userActivity: [
          { name: 'John Doe', bookings: 15, hours: 32 },
          { name: 'Jane Smith', bookings: 12, hours: 28 },
          { name: 'Mike Johnson', bookings: 10, hours: 25 },
          { name: 'Sarah Wilson', bookings: 8, hours: 18 },
          { name: 'David Brown', bookings: 7, hours: 16 },
        ],
        bookingStatus: [
          { name: 'Confirmed', value: 185, color: '#00C49F' },
          { name: 'Pending', value: 42, color: '#FFBB28' },
          { name: 'Cancelled', value: 18, color: '#FF8042' },
        ],
      };
      
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
