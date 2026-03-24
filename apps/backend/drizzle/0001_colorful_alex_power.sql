CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`roll_id` text NOT NULL,
	`roll_type` text NOT NULL,
	`content` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `comments_roll_idx` ON `comments` (`roll_id`,`roll_type`);