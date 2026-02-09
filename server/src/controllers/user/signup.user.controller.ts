import bcrypt from "bcrypt";
import { usersTable } from "../../models/user.model.js";
import { ApiError } from "../../middlewares/error/api.error.middleware.js";
import { NextFunction, Request, Response } from "express";
import { db } from "../../configs/database.config.js";

/**
 * User signup controller
 * Creates a new user account with hashed password and optional profile picture
 * 
 * @param req - Express request object containing user data and optional file
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
/**
 * Handle user registration with optional profile picture
 * Hashes password and stores user data in database
 */
const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const profilePicFile = req.file; // Uploaded profile picture file

    // Ensure database connection is available
    if (!db) {
      throw ApiError.badRequest("Database connection not established");
    }

    // Hash password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate profile picture path if file was uploaded
    const profilePicPath = profilePicFile
      ? `/uploads/profiles/${profilePicFile.filename}`
      : null;

    // Create new user record in database
    const [newUser] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password: hashedPassword,
        profilePic: profilePicPath,
      })
      .returning(); // Return the created user data

    // Send success response with user data (excluding password)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: newUser.id,
        userName: newUser.name,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

export { signup };
