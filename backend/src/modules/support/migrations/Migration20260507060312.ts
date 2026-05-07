import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260507060312 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ticket" ("id" text not null, "display_id" text not null, "customer_id" text not null, "order_id" text null, "subject" text not null, "message" text not null, "status" text check ("status" in ('open', 'in_progress', 'resolved')) not null default 'open', "admin_reply" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ticket_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ticket_deleted_at" ON "ticket" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ticket" cascade;`);
  }

}
