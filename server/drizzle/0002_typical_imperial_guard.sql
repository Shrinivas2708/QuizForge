ALTER TABLE "sessions" ADD COLUMN "ip_address" varchar(255);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified";