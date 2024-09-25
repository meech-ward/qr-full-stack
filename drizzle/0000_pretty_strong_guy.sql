CREATE TABLE `qr_codes` (
	`id` varchar(10) NOT NULL,
	`content` text NOT NULL,
	`type` varchar(4) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `qr_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qr_images` (
	`id` varchar(10) NOT NULL,
	`qr_code_id` varchar(10) NOT NULL,
	`image_name` text NOT NULL,
	`filter` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qr_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qr_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`qr_id` varchar(10) NOT NULL,
	`scanned_at` timestamp DEFAULT (now()),
	`user_agent` text,
	`ip_address` varchar(45),
	`location` text,
	`referer` text,
	CONSTRAINT `qr_uses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `qr_images` ADD CONSTRAINT `qr_images_qr_code_id_qr_codes_id_fk` FOREIGN KEY (`qr_code_id`) REFERENCES `qr_codes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_uses` ADD CONSTRAINT `qr_uses_qr_id_qr_codes_id_fk` FOREIGN KEY (`qr_id`) REFERENCES `qr_codes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `type_idx` ON `qr_codes` (`type`);--> statement-breakpoint
CREATE INDEX `qr_code_id_idx` ON `qr_images` (`qr_code_id`);--> statement-breakpoint
CREATE INDEX `qr_id_idx` ON `qr_uses` (`qr_id`);