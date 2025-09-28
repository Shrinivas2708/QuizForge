ALTER TABLE "verificationToken" DROP CONSTRAINT "verificationToken_identifier_token_pk";--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "value" text NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "verificationToken" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "verificationToken" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "verificationToken" DROP COLUMN "expires";