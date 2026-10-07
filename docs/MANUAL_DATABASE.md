# Manual database preparation

**No `.sql` file was edited, renamed, removed, or executed during this work.**
The application and its startup/readiness checks never create tables, provision
database accounts, migrate, seed, or reset a database.

## Required before production

1. Back up any existing database and verify that the backup can be restored to a
   separate instance. Use a currently maintained MariaDB release. These scripts
   contain MariaDB-specific syntax; do not assume compatibility with Oracle MySQL.
2. Review `db/db-init/init.sql`, especially its account-provisioning section
   (original lines 17–25). It contains a committed password, a wildcard-host
   account, `CREATE OR REPLACE USER`, and broad database grants. **Do not import
   the original script blindly.** Manually replace/remove that section before
   using it. Rotate that credential if it was ever used; also rotate any real
   password previously shared in chat. Deleting a literal later does not remove
   it from Git history. No credential values are reproduced here.
3. Provision an application account separately using your database administrator
   account. Give it only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on the chosen
   application database. Restrict the account host to the actual application
   connection source; use a separate administrator for schema work. The example
   configuration uses `vyra_app`, but that account is **not** created by the app.
4. Review the schema in this order: `init.sql`, `001_update_database.sql`, then
   `002_add_nutrition_logs.sql`. For an existing database, apply only the missing
   changes after reviewing its current schema and data. All scripts select the
   database `fullstack_demo`; if you choose another `DB_NAME`, manually adjust
   their database selection before executing them. No automatic import command
   is provided because the existing account-provisioning block needs your review.
5. Required tables: `users`, `profiles`, `body_profile`, `weight_records`,
   `task_lists`, `tasks`, and `nutrition_logs`. Tasks need both `reminder_at` and
   `reminder_sent_at`. Nutrition uses `logged_date`; weight history uses
   `recorded_date`. The additive scripts include older-installation upgrades and
   the nutrition table. Keep their foreign keys and profile/date indexes.
6. Inspect existing users before adding uniqueness or `NOT NULL` constraints.
   Older rows may have missing email/password hashes; reconcile those accounts
   through verified ownership instead of assigning a shared password. Fresh
   initialization already gives email a unique index; the first additive script
   can add another equivalent index. Remove the redundant index manually after
   checking the actual index names and constraints; it is not a startup blocker.
7. Keep MariaDB off the public internet. For a remote database, require TLS and
   configure `DB_SSL=true`; supply the provider's CA via `DB_SSL_CA` when needed.
   Plan tested backups, retention, recovery, and enough connections for all app
   instances. Never disable certificate verification to make a connection work.

## Connection identity

A MariaDB account is identified by **user and host**. An account at `localhost`
and one at `%` are separate accounts and may have different passwords/grants.
The Node connector uses TCP for `DB_HOST=127.0.0.1`; a terminal's default local
socket can select a different account. Match your host/grants to the application
connection. Inside Docker, `127.0.0.1` means the application container, not your
host or database container. Configure a reachable database hostname instead.

Do not change the administrator's socket authentication just to make the app
connect. For systems using MariaDB's local administrator socket authentication,
an authorized administrator can use `sudo mariadb`; the application must still
use its separate limited account.

## Verify without modifying data

After filling `backend/.env`, run from the repository root:

```bash
npm run check:db -w backend
```

This uses `SELECT ... LIMIT 0` to verify connectivity and every column the app's
main features require. It does not validate every index, foreign key, grant,
existing row, or transaction behavior. `/api/health` performs the same check and
returns 503 until the database/schema is ready; `/api/live` only checks that the
HTTP process is alive. Then test registration, profiles, weight, tasks, reminders,
and nutrition using a dedicated staging account in your prepared database.

## Data/model limits to retain or address manually

- Previously saved impossible or future weight dates are not automatically
  rewritten. Review them; the UI now supports deleting an incorrect weight entry.
- Weight records store calculated BMI/body fat, but do not snapshot the height,
  birth date, or circumference inputs. Backdated records use the profile's
  current measurements. Accurate historical recalculation would require a
  separately designed schema change and data strategy.
- `measurement_records` exists in the SQL but the current Measurements page
  edits the current `body_profile`. It does not claim to display a measurement
  history. Recipes are calculation workspaces, not saved recipes. Reminders are
  checked while their page is open, not delivered by a background worker.

The added weight deletion and task-summary endpoints use existing tables and
need no additional SQL changes.
