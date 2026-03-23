CREATE TABLE `trackers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'My Tracker' NOT NULL,
	`skill_index` integer DEFAULT 1 NOT NULL,
	`bonus_index` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weapons` (
	`id` text PRIMARY KEY NOT NULL,
	`tracker_id` text NOT NULL,
	`weapon_type` text NOT NULL,
	`element` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tracker_id`) REFERENCES `trackers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weapons_tracker_type_element_idx` ON `weapons` (`tracker_id`,`weapon_type`,`element`);--> statement-breakpoint
CREATE TABLE `skill_rolls` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`weapon_id` text NOT NULL,
	`group_skill` text NOT NULL,
	`series_skill` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`weapon_id`) REFERENCES `weapons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skill_rolls_weapon_index_idx` ON `skill_rolls` (`weapon_id`,`index`);--> statement-breakpoint
CREATE TABLE `bonus_rolls` (
	`id` text PRIMARY KEY NOT NULL,
	`index` integer NOT NULL,
	`weapon_id` text NOT NULL,
	`bonus_1` text NOT NULL,
	`bonus_2` text NOT NULL,
	`bonus_3` text NOT NULL,
	`bonus_4` text NOT NULL,
	`bonus_5` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`weapon_id`) REFERENCES `weapons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bonus_rolls_weapon_index_idx` ON `bonus_rolls` (`weapon_id`,`index`);