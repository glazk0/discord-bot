CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"locale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "guilds_created_at_index" ON "guilds" USING btree ("created_at");