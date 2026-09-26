import { Request, Response, NextFunction } from 'express';

export function rulesHandler(requireRules: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: `Unauthorized: You need to be authenticated`,
      });
    }

    const userRules = new Set(req.user.rules);

    if (userRules.has('admin:*')) {
      return next();
    }

    if (Array.isArray(requireRules)) {
      for (const rule of requireRules) {
        if (!userRules.has(rule)) {
          return res.status(403).json({
            error: `Forbidden: requires ${rule}`,
          });
        }
      }
    } else {
      if (!userRules.has(requireRules)) {
        return res.status(403).json({
          error: `Forbidden: requires ${requireRules}`,
        });
      }
    }

    next();
  };
}
