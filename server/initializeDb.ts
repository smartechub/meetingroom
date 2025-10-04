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
    } else {
      console.log("Admin user already exists");
    }
    
    // Check and create default rooms
    const existingRooms = await storage.getAllRooms();
    
    if (existingRooms.length === 0) {
      const defaultRooms = [
        {
          name: "Beam",
          capacity: 5,
          description: "IT Side",
          equipment: ["telephone", "whiteboard", "tv"],
          isActive: true,
        },
        {
          name: "Flush",
          capacity: 4,
          description: "IT Side",
          equipment: ["telephone", "whiteboard", "mic-speaker", "camera", "tv"],
          isActive: true,
        },
        {
          name: "Sunshine",
          capacity: 4,
          description: "War Room Entrance",
          equipment: ["telephone", "whiteboard", "mic-speaker", "camera", "tv"],
          isActive: true,
        },
      ];
      
      for (const room of defaultRooms) {
        await storage.createRoom(room);
      }
      
      console.log("Default rooms created: Beam, Flush, Sunshine");
    } else {
      console.log(`${existingRooms.length} room(s) already exist in database`);
    }
    
    return existingAdmin;
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}