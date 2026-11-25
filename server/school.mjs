import { atomic, createAccount, db, loadSchool, saveSchool } from "./store.mjs";
import * as school from "./school-core.mjs";

const store = {
  atomic,
  createAccount,
  loadSchool,
  saveSchool,
  listSchools(network) {
    return db
      .prepare("SELECT id,name FROM schools WHERE network=? ORDER BY name")
      .all(network);
  },
  listAccounts(schoolId, activeOnly = false) {
    return db
      .prepare(
        "SELECT * FROM accounts WHERE school=? AND (?=0 OR active=1) ORDER BY name",
      )
      .all(schoolId, Number(activeOnly));
  },
  getAccount(schoolId, id, activeOnly = false) {
    return db
      .prepare(
        "SELECT * FROM accounts WHERE school=? AND id=? AND (?=0 OR active=1)",
      )
      .get(schoolId, id, Number(activeOnly));
  },
  setAccountActive(id, active) {
    db.prepare("UPDATE accounts SET active=? WHERE id=?").run(
      Number(active),
      id,
    );
    db.prepare("DELETE FROM sessions WHERE account=?").run(id);
  },
  operationExists(schoolId, accountId, id) {
    return Boolean(
      db
        .prepare(
          "SELECT 1 FROM operations WHERE school=? AND account=? AND id=?",
        )
        .get(schoolId, accountId, id),
    );
  },
  recordOperation(schoolId, accountId, id) {
    db.prepare("INSERT INTO operations VALUES (?,?,?)").run(
      schoolId,
      accountId,
      id,
    );
  },
};

export const readWorkspace = (...args) => school.readWorkspace(store, ...args);
export const perform = (...args) => school.perform(store, ...args);
export const scopedExtras = (...args) => school.scopedExtras(store, ...args);
export { belongs, report } from "./school-core.mjs";
