import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users", async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    name: usersTable.name,
    role: usersTable.role,
    isActive: usersTable.isActive,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.post("/users", async (req, res) => {
  const { username, password, name, role, isActive } = req.body;
  if (!username || !password || !role) {
    res.status(400).json({ error: "username, password, and role required" });
    return;
  }
  const result = await db.insert(usersTable).values({
    username, password, name: name || null, role: role || "staff", isActive: isActive !== false,
  }).returning();
  const u = result[0];
  res.status(201).json({ id: u.id, username: u.username, name: u.name, role: u.role, isActive: u.isActive, createdAt: u.createdAt.toISOString() });
});

router.put("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, password, name, role, isActive } = req.body;
  const updates: Record<string, unknown> = {};
  if (username !== undefined) updates.username = username;
  if (password !== undefined) updates.password = password;
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  const result = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!result[0]) { res.status(404).json({ error: "User not found" }); return; }
  const u = result[0];
  res.json({ id: u.id, username: u.username, name: u.name, role: u.role, isActive: u.isActive, createdAt: u.createdAt.toISOString() });
});

router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true, message: "User deleted" });
});

export default router;
