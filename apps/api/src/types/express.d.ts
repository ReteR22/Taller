// Global Express type augmentation.
// Adds `user` to the base Request so route handlers typed as
// (req: Request, ...) accept the populated user object set by
// auth.middleware without triggering TS overload errors.
export {}

declare global {
  namespace Express {
    interface Request {
      user: {
        id:    string
        role:  string
        email: string
        name:  string
      }
    }
  }
}
