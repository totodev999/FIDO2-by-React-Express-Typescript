import express, { Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session, { Store } from "express-session";
import passport from "passport";
import authRouter from "./routes/authRoute.js";
import { fileURLToPath } from "url";
import protectedRoute from "./routes/protectedRoute.js";
import connect from "connect-sqlite3";
declare module "express-session" {
  interface SessionData {
    message?: string;
    messages?: string[];
    passport?: {
      user?: {
        o?: string;
        id: number;
        username: string;
        name: string;
        test: string;
      };
    };
  }
}
const SQLiteStore = connect(session);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  "/api/**",
  session({
    secret: "keyboard cat",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }) as Store,
    cookie: {
      httpOnly: true,
    },
  })
);

// passport.deserializeが動く
app.use("/api/**", passport.session());

// 認証などでエラーがあった時にmessageに内容が設定されるので
app.use(function (req, res, next) {
  if (req.session) {
    const msgs = req.session.message ?? [];
    res.locals.messages = msgs;
    res.locals.hasMessages = !!msgs.length;
    req.session.messages = [];
  }
  next();
});

app.use((req, res, next) => {
  console.log("開始", req.path, req.sessionID);
  res.on("finish", () => {
    console.log("終了", req.path, req.sessionID);
  });
  next();
});

// React
app.use(express.static("public"));
app.use(express.static(path.resolve(__dirname, "../client/dist")));
app.use("/", (req: Request, res: Response, next) => {
  if (!req.path.startsWith("/api")) {
    return res.sendFile(
      path.resolve(__dirname, "../client/dist", "index.html")
    );
  }
  next();
});

app.use("/", authRouter);
app.use(
  "/",
  (req, res, next) => {
    if (req.user) {
      return next();
    }
    return res.status(401).send("Unauthorized");
  },
  protectedRoute
);

// error handler
app.use(function (err, _req, res, _next) {
  console.log("エラー", err);
  return res.status(err.status || 500).send(err);
});

export default app;
