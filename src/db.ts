import sqlite3 from "sqlite3";
import { mkdirp } from "mkdirp";

mkdirp.sync("./var/db");

const db = new sqlite3.Database("./var/db/todos.db");

db.serialize(function () {
  db.run(
    `CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    salt BLOB, \
    name TEXT, \
    test TEXT, \
    handle BLOB UNIQUE \
  )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS public_key_credentials ( \
    id INTEGER PRIMARY KEY, \
    user_id INTEGER NOT NULL, \
    external_id TEXT UNIQUE, \
    public_key TEXT \
  )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    owner_id INTEGER NOT NULL, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )`
  );
});

export default db;
