import express from "express";
import passport from "passport";
import WebAuthnStrategy, {
  SessionChallengeStore,
} from "passport-fido2-webauthn";
import base64url from "base64url";
import { v4 as uuid } from "uuid";
import db from "../db.js";

const authRouter = express.Router();

const store = new SessionChallengeStore();
authRouter.use((req, res, next) => {
  console.log("authRoute", req.path);
  next();
});
passport.use(
  new WebAuthnStrategy(
    { store },
    function verify(id, userHandle, cb) {
      console.log("verify");
      db.get(
        "SELECT * FROM public_key_credentials WHERE external_id = ?",
        [id],
        function (
          err,
          row: {
            id: number;
            user_id: number;
            external_id: string;
            public_key: string;
          }
        ) {
          if (err) {
            return cb(err);
          }
          if (!row) {
            return cb(null, false, { message: "Invalid key. " });
          }
          const publicKey = row.public_key;
          db.get(
            "SELECT * FROM users WHERE rowid = ?",
            [row.user_id],
            function (
              err,
              row: {
                id: number;
                username: string;
                hashed_password: string;
                salt: string;
                name: string;
                test: string;
                handle: Uint8Array;
              }
            ) {
              if (err) {
                return cb(err);
              }
              if (!row) {
                return cb(null, false, { message: "Invalid key. " });
              }
              if (Buffer.compare(row.handle, userHandle) !== 0) {
                return cb(null, false, { message: "Invalid key. " });
              }
              // function verified(err, user, publicKey, info)の呼び出し。info
              return cb(null, row, publicKey, "oreore");
            }
          );
        }
      );
    },
    // node_modules/passport-fido2-webauthn/lib/strategy.jsを参照。
    // case 6:
    //   return self._register(ctx.user, credentialId, pem, flags, authenticatorData.signCount, registered);
    function register(user, id, publicKey, flags, signCount, cb) {
      console.log("register", flags, signCount);
      db.run(
        "INSERT INTO users (username, name, handle, test) VALUES (?, ?, ?, ?)",
        [user.name, user.displayName, user.id, user.test],
        function (err) {
          if (err) {
            return cb(err);
          }
          const newUser = {
            id: this.lastID,
            username: user.name,
            name: user.displayName,
            test: user.test,
          };
          db.run(
            "INSERT INTO public_key_credentials (user_id, external_id, public_key) VALUES (?, ?, ?)",
            [newUser.id, id, publicKey],
            function (err) {
              if (err) {
                return cb(err);
              }
              return cb(null, newUser);
            }
          );
        }
      );
    }
  )
);

// NOTE:passport.serializeUserは認証の時に一回だけ動く
passport.serializeUser(function (
  user: { id: number; username: string; name: string; test: string },
  cb
) {
  console.log("passport.serializeUser");
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.username,
      name: user.name,
      test: user.test,
    });
  });
});

// passport.deserializeUserはapp.use(passport.session()); or app.use(passport.authenticate('session'));でよびだされる
// req.userに値をセットする（serializeUserでcbで渡したものを受け取る。必要に応じて編集やデータ取得を実施できる）
passport.deserializeUser(function (
  user: { id: number; username: string; name: string; test: string },
  cb
) {
  console.log("passport.deserializeUser");

  process.nextTick(function () {
    return cb(null, user);
  });
});

// Origin mismatchが発生する場合
// trust proxyを有効にすると以下のファイルのなかでclientDataJSONのoriginとrequestのoriginの比較の際にx-forwarded-hostを参照するようになる
// node_modules/passport-fido2-webauthn/lib/utils.js
// 基本的には別サイトをプロキシしていないかをチェックするのは正しい挙動らしい
// https://chromium.googlesource.com/chromium/src/+/master/content/browser/webauth/client_data_json.md
authRouter.post(
  "/api/login/public-key",
  passport.authenticate("webauthn", {
    failureMessage: true,
    failWithError: true,
  }),
  function (req, res, next) {
    console.log("OKだよ", req.user);
    res.json({ ok: true, location: "/logined-page" });
  },
  function (err, req, res, next) {
    console.log("req NG", req.body, req.session, err);
    const cxx = Math.floor(err.status / 100);
    if (cxx !== 4) {
      return next(err);
    }
    res.json({ ok: false, location: "/login" });
  }
);

authRouter.post("/api/login/public-key/challenge", function (req, res, next) {
  console.log("/api/login/public-key/challenge", req.body);
  store.challenge(req, function (err, challenge) {
    if (err || !challenge) {
      return next(err);
    }
    res.json({ challenge: base64url.encode(challenge) });
  });
});

authRouter.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

authRouter.post("/api/signup/public-key/challenge", function (req, res, next) {
  // 16byte形式でUUIDを生成
  console.log("/api/signup/public-key/challenge");
  let handle = Buffer.alloc(16);
  handle = uuid({}, handle);
  console.log("handle", handle, req.body);
  const user = {
    id: handle,
    name: req.body.name,
    displayName: req.body.username,
    test: req.body.test,
  };
  // ここを参照 https://github.com/jaredhanson/passport-webauthn
  store.challenge(req, { user }, function (err, challenge) {
    if (err || !challenge) {
      return next(err);
    }
    res.json({
      user: { ...user, id: base64url.encode(user.id) },
      challenge: base64url.encode(challenge),
    });
  });
});

export default authRouter;
