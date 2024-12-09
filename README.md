# qr

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.26. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## DataBAse

```sql
CREATE DATABASE my_app;

CREATE USER 'my_app_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON my_app.* TO 'my_app_user'@'localhost';
FLUSH PRIVILEGES;

CREATE USER 'my_app_user'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON my_app.* TO 'my_app_user'@'%';
FLUSH PRIVILEGES;
```
