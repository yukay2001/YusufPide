import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Kullanıcı adı veya şifre hatalı" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: "Kullanıcı adı veya şifre hatalı" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
}

export function requireRole(...roleNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
    }

    try {
      const user = req.user as User;
      
      // Get user's role from database
      const userRole = await storage.getRole(user.roleId);
      if (!userRole) {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      // Check if user's role is in the allowed roles
      if (!roleNames.includes(userRole.name)) {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Yetki kontrolü sırasında bir hata oluştu" });
    }
  };
}

// Permission-based middleware for more granular control
export function requirePermission(...permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Giriş yapmanız gerekiyor" });
    }

    try {
      const user = req.user as User;
      
      // Get user's permissions from database
      const userPermissions = await storage.getUserPermissions(user.id);
      const userPermissionKeys = userPermissions.map(p => p.key);

      // Check if user has at least one of the required permissions
      const hasPermission = permissionKeys.some(key => userPermissionKeys.includes(key));
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Yetki kontrolü sırasında bir hata oluştu" });
    }
  };
}

export default passport;
