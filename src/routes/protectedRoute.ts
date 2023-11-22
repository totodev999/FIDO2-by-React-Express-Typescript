import express from "express";
const protectedRoute = express.Router();

protectedRoute.get("/api/login-user", (req, res, next) => {
  return res.json({
    user: { ...req.user },
  });
});

export default protectedRoute;
