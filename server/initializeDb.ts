import bcrypt from "bcrypt";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";

export async function initializeDatabase() {
  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByEmail("admin@company.com");
    
    if (!existingAdmin) {
      // Create default admin user
      const passwordHash = await bcrypt.hash("admin123", 10);
      
      const adminUser = await storage.createUser({
        id: uuidv4(),
        email: "admin@company.com",
        passwordHash,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      });
      
      console.log("Default admin user created:");
      console.log("Email: admin@company.com");
      console.log("Password: admin123");
      console.log("Please change the password after first login.");
      
      return adminUser;
    }
    
    console.log("Admin user already exists");
    return existingAdmin;
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}